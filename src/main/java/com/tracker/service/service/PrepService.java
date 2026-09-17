package com.tracker.service.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tracker.service.dto.PrepDtos.*;
import com.tracker.service.entity.*;
import com.tracker.service.exception.ConflictException;
import com.tracker.service.exception.NotFoundException;
import com.tracker.service.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

/**
 * The user's preparation bank and campaign.
 *
 * Everything here is scoped to one {@link User}; no method takes an id from the
 * caller, so one user's material is never addressable by another.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PrepService {

    private final PrepCategoryRepository categories;
    private final PrepTopicRepository topics;
    private final PrepQuestionRepository questions;
    private final PrepReferenceRepository references;
    private final PrepPlanWeekRepository planWeeks;
    private final StudyProgressRepository progress;

    // Constructed rather than injected: this application does not expose an
    // ObjectMapper bean, and GeminiService already does the same. Keeping it
    // local also means the stored JSON shape cannot drift with the web layer's
    // serialisation settings.
    private final ObjectMapper mapper = new ObjectMapper();

    /* ================= import ================= */

    /**
     * Replaces the caller's whole bank.
     *
     * A replace rather than a merge because the generator that produces this
     * payload is the source of truth: re-running it after a question is removed
     * upstream must remove it here too, and a merge would leave it behind
     * forever.
     */
    @Transactional
    public ImportResult importBank(User me, ImportRequest req) {
        Long uid = me.getId();

        questions.deleteByUserId(uid);
        references.deleteByUserId(uid);
        topics.deleteByUserId(uid);
        categories.deleteByUserId(uid);

        // Flush before inserting. Hibernate orders its action queue inserts
        // first and deletes LAST, so without this the re-imported rows collide
        // with the ones being replaced on (user_id, *_key) and the whole import
        // fails — but only on the SECOND import, which is easy to miss.
        questions.flush();
        references.flush();
        topics.flush();
        categories.flush();

        int nCat = 0, nTop = 0, nQ = 0, nRef = 0, nWeek = 0;

        for (CategoryDto c : nullSafe(req.categories())) {
            categories.save(PrepCategory.builder()
                    .categoryKey(c.key()).name(c.name()).blurb(c.blurb())
                    .kind(c.kind()).sortOrder(c.order()).user(me).build());
            nCat++;
        }
        for (TopicDto t : nullSafe(req.topics())) {
            topics.save(PrepTopic.builder()
                    .topicKey(t.key()).categoryKey(t.categoryKey()).name(t.name())
                    .blurb(t.blurb()).companyKey(t.companyKey()).part(t.part())
                    .sortOrder(t.order()).user(me).build());
            nTop++;
        }
        for (QuestionDto q : nullSafe(req.questions())) {
            questions.save(PrepQuestion.builder()
                    .questionKey(q.key()).topicKey(q.topicKey()).categoryKey(q.categoryKey())
                    .companyKey(q.companyKey()).prompt(q.prompt()).answerHtml(q.answerHtml())
                    .followUpsJson(writeJson(q.followUps()))
                    .tags(q.tags() == null ? null : String.join(",", q.tags()))
                    .difficulty(q.difficulty()).source(q.source()).user(me).build());
            nQ++;
        }
        for (ReferenceDto r : nullSafe(req.references())) {
            references.save(PrepReference.builder()
                    .referenceKey(r.key()).topicKey(r.topicKey()).categoryKey(r.categoryKey())
                    .companyKey(r.companyKey()).heading(r.heading()).level(r.level())
                    .html(r.html()).source(r.source()).user(me).build());
            nRef++;
        }

        PlanDto plan = req.plan();
        if (plan != null) {
            planWeeks.deleteByUserIdAndPlanKey(uid, plan.key());
            planWeeks.flush();
            int i = 0;
            for (PlanWeekDto w : nullSafe(plan.weeks())) {
                planWeeks.save(PrepPlanWeek.builder()
                        .planKey(plan.key()).weekKey(w.key())
                        .startDate(LocalDate.parse(w.start())).endDate(LocalDate.parse(w.end()))
                        .title(w.title()).weekdays(w.weekdays()).weekendWork(w.weekend())
                        .problemsJson(writeJson(w.problems())).challenge(w.challenge())
                        .videoLabel(w.videoLabel()).videoQuery(w.videoQuery())
                        .algomaster(w.algomaster()).milestone(w.milestone())
                        .light(Boolean.TRUE.equals(w.light()))
                        .sortOrder(w.order() != null ? w.order() : i)
                        .user(me).build());
                nWeek++;
                i++;
            }
        }

        log.info("prep import for user {}: {} categories, {} topics, {} questions, {} references, {} weeks",
                uid, nCat, nTop, nQ, nRef, nWeek);
        return new ImportResult(nCat, nTop, nQ, nRef, nWeek);
    }

    /* ================= reads ================= */

    /** Everything the client needs to render navigation, minus answer bodies. */
    @Transactional(readOnly = true)
    public BankView getBank(User me, String planKey) {
        Long uid = me.getId();

        List<CategoryDto> cats = categories.findByUserId(uid).stream()
                .sorted(Comparator.comparing(c -> c.getSortOrder() == null ? 0 : c.getSortOrder()))
                .map(c -> new CategoryDto(c.getCategoryKey(), c.getName(), c.getBlurb(), c.getKind(), c.getSortOrder()))
                .toList();

        List<TopicDto> tops = topics.findByUserId(uid).stream()
                .sorted(Comparator.comparing(t -> t.getSortOrder() == null ? 0 : t.getSortOrder()))
                .map(this::toDto)
                .toList();

        List<QuestionStub> stubs = questions.findByUserId(uid).stream()
                .map(q -> new QuestionStub(q.getQuestionKey(), q.getTopicKey(), q.getCategoryKey(),
                        q.getCompanyKey(), q.getPrompt(), splitTags(q.getTags())))
                .toList();

        List<ReferenceDto> refs = references.findByUserId(uid).stream().map(this::toDto).toList();

        return new BankView(cats, tops, stubs, refs, getPlan(me, planKey));
    }

    /** Full questions, answers included, for one topic. */
    @Transactional(readOnly = true)
    public List<QuestionDto> getQuestions(User me, String topicKey) {
        return questions.findByUserIdAndTopicKey(me.getId(), topicKey).stream().map(this::toDto).toList();
    }

    /**
     * Substring search across prompts and answers.
     *
     * Done in memory: the bank is a few hundred rows per user and a LIKE over a
     * TEXT column would not be meaningfully better without a real full-text
     * index. Revisit if a user ever has tens of thousands of questions.
     */
    @Transactional(readOnly = true)
    public List<QuestionDto> search(User me, String query, int limit) {
        String q = query == null ? "" : query.toLowerCase(Locale.ROOT).trim();
        if (q.length() < 2) return List.of();
        String[] terms = q.split("\\s+");

        return questions.findByUserId(me.getId()).stream()
                .filter(row -> {
                    String hay = (row.getPrompt() + " " + Optional.ofNullable(row.getAnswerHtml()).orElse(""))
                            .toLowerCase(Locale.ROOT);
                    for (String t : terms) if (!hay.contains(t)) return false;
                    return true;
                })
                .sorted(Comparator.comparingInt(row -> row.getPrompt().toLowerCase(Locale.ROOT).contains(q) ? 0 : 1))
                .limit(Math.max(1, Math.min(limit, 200)))
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public PlanDto getPlan(User me, String planKey) {
        if (planKey == null || planKey.isBlank()) return null;
        List<PrepPlanWeek> weeks = planWeeks.findByUserIdAndPlanKeyOrderBySortOrderAsc(me.getId(), planKey);
        if (weeks.isEmpty()) return null;
        return new PlanDto(planKey, weeks.stream().map(this::toDto).toList());
    }

    /* ================= progress ================= */

    @Transactional(readOnly = true)
    public ProgressView getProgress(User me) {
        return progress.findByUserId(me.getId())
                .map(p -> new ProgressView(readMap(p.getDataJson()), p.getRevision()))
                .orElseGet(() -> new ProgressView(Map.of(), 0L));
    }

    /**
     * @throws ConflictException when the caller's revision is behind stored
     *         state — the caller should re-read and merge rather than clobber.
     */
    @Transactional
    public ProgressView saveProgress(User me, ProgressRequest req) {
        StudyProgress row = progress.findByUserId(me.getId()).orElseGet(() ->
                StudyProgress.builder().user(me).dataJson("{}").revision(0L).build());

        if (req.revision() != null && row.getId() != null && req.revision() != row.getRevision()) {
            throw new ConflictException(
                    "stale revision " + req.revision() + ", stored is " + row.getRevision());
        }

        row.setDataJson(writeJson(req.data() == null ? Map.of() : req.data()));
        row.setRevision(row.getRevision() + 1);
        progress.save(row);
        return new ProgressView(readMap(row.getDataJson()), row.getRevision());
    }

    /* ================= mapping ================= */

    private TopicDto toDto(PrepTopic t) {
        return new TopicDto(t.getTopicKey(), t.getCategoryKey(), t.getName(), t.getBlurb(),
                t.getCompanyKey(), t.getPart(), t.getSortOrder());
    }

    private ReferenceDto toDto(PrepReference r) {
        return new ReferenceDto(r.getReferenceKey(), r.getTopicKey(), r.getCategoryKey(),
                r.getCompanyKey(), r.getHeading(), r.getLevel(), r.getHtml(), r.getSource());
    }

    private QuestionDto toDto(PrepQuestion q) {
        List<FollowUpDto> fus = readJson(q.getFollowUpsJson(), new TypeReference<List<FollowUpDto>>() {});
        return new QuestionDto(q.getQuestionKey(), q.getTopicKey(), q.getCategoryKey(), q.getCompanyKey(),
                q.getPrompt(), q.getAnswerHtml(), fus == null ? List.of() : fus,
                splitTags(q.getTags()), q.getDifficulty(), q.getSource());
    }

    private PlanWeekDto toDto(PrepPlanWeek w) {
        List<List<String>> problems = readJson(w.getProblemsJson(), new TypeReference<List<List<String>>>() {});
        return new PlanWeekDto(w.getWeekKey(), w.getStartDate().toString(), w.getEndDate().toString(),
                w.getTitle(), w.getWeekdays(), w.getWeekendWork(),
                problems == null ? List.of() : problems, w.getChallenge(),
                w.getVideoLabel(), w.getVideoQuery(), w.getAlgomaster(), w.getMilestone(),
                w.isLight(), w.getSortOrder());
    }

    private static List<String> splitTags(String tags) {
        if (tags == null || tags.isBlank()) return List.of();
        return Arrays.stream(tags.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    private static <T> List<T> nullSafe(List<T> in) {
        return in == null ? List.of() : in;
    }

    private String writeJson(Object value) {
        if (value == null) return null;
        try {
            return mapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new IllegalArgumentException("could not serialise prep payload", e);
        }
    }

    private <T> T readJson(String json, TypeReference<T> type) {
        if (json == null || json.isBlank()) return null;
        try {
            return mapper.readValue(json, type);
        } catch (Exception e) {
            // A malformed stored blob must not take out the whole read — the
            // rest of the question is still worth returning.
            log.warn("could not parse stored prep JSON: {}", e.getMessage());
            return null;
        }
    }

    private Map<String, Object> readMap(String json) {
        Map<String, Object> m = readJson(json, new TypeReference<Map<String, Object>>() {});
        return m == null ? Map.of() : m;
    }

    /** Used by the controller to turn a missing plan into a 404 rather than a null body. */
    public PlanDto requirePlan(User me, String planKey) {
        PlanDto plan = getPlan(me, planKey);
        if (plan == null) throw new NotFoundException("No plan '" + planKey + "' for this user");
        return plan;
    }
}
