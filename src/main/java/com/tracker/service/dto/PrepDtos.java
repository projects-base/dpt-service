package com.tracker.service.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;
import java.util.Map;

/**
 * Wire shapes for the preparation bank.
 *
 * These mirror the study client's own types so an import is a straight copy
 * rather than a translation — the client already holds the material in this
 * shape, generated from the source HTML kit.
 */
public final class PrepDtos {

    private PrepDtos() {}

    /* ---------------- import ---------------- */

    /**
     * A whole bank in one request. Import is a REPLACE, not a merge: the
     * generator is the source of truth and re-running it must not leave
     * orphans behind from a previous shape.
     */
    public record ImportRequest(
            List<CategoryDto> categories,
            List<TopicDto> topics,
            List<QuestionDto> questions,
            List<ReferenceDto> references,
            PlanDto plan
    ) {}

    public record ImportResult(
            int categories,
            int topics,
            int questions,
            int references,
            int planWeeks
    ) {}

    /* ---------------- content ---------------- */

    public record CategoryDto(
            @NotBlank String key,
            @NotBlank String name,
            String blurb,
            String kind,
            Integer order
    ) {}

    public record TopicDto(
            @NotBlank String key,
            @NotBlank String categoryKey,
            @NotBlank String name,
            String blurb,
            String companyKey,
            Integer part,
            Integer order
    ) {}

    public record FollowUpDto(String q, String a) {}

    public record QuestionDto(
            @NotBlank String key,
            @NotBlank String topicKey,
            String categoryKey,
            String companyKey,
            @NotBlank String prompt,
            String answerHtml,
            List<FollowUpDto> followUps,
            List<String> tags,
            String difficulty,
            String source
    ) {}

    public record ReferenceDto(
            @NotBlank String key,
            @NotBlank String topicKey,
            String categoryKey,
            String companyKey,
            String heading,
            Integer level,
            String html,
            String source
    ) {}

    /* ---------------- plan ---------------- */

    public record PlanWeekDto(
            @NotBlank String key,
            String start,
            String end,
            String title,
            String weekdays,
            String weekend,
            List<List<String>> problems,
            String challenge,
            String videoLabel,
            String videoQuery,
            String algomaster,
            String milestone,
            Boolean light,
            Integer order
    ) {}

    public record PlanDto(
            @NotBlank String key,
            List<PlanWeekDto> weeks
    ) {}

    /* ---------------- reads ---------------- */

    /**
     * Everything except answer bodies.
     *
     * Questions arrive as stubs — key, topic and prompt — because the full bank
     * is around a megabyte of HTML and the client only ever renders one topic
     * at a time. Answers come from {@code /questions/{topicKey}} or from search.
     */
    public record BankView(
            List<CategoryDto> categories,
            List<TopicDto> topics,
            List<QuestionStub> questions,
            List<ReferenceDto> references,
            PlanDto plan
    ) {}

    public record QuestionStub(
            String key,
            String topicKey,
            String categoryKey,
            String companyKey,
            String prompt,
            List<String> tags
    ) {}

    /* ---------------- progress ---------------- */

    /**
     * @param revision the revision the client last saw. A write carrying a
     *                 stale one is refused, so a second device cannot silently
     *                 overwrite a session it never read.
     */
    public record ProgressView(Map<String, Object> data, long revision) {}

    public record ProgressRequest(Map<String, Object> data, Long revision) {}
}
