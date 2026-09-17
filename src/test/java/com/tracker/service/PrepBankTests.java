package com.tracker.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tracker.service.entity.User;
import com.tracker.service.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * The preparation bank the InterviewKit study client imports into.
 *
 * These cover the parts that would silently lose material: the import being a
 * replace, answers being excluded from the navigation payload but present on
 * the per-topic read, per-user isolation, and the revision guard that stops a
 * second device overwriting a session it never read.
 */
@SpringBootTest
@AutoConfigureMockMvc
class PrepBankTests {

    @Autowired MockMvc mvc;
    @Autowired UserRepository userRepository;
    @Autowired PrepCategoryRepository categoryRepository;
    @Autowired PrepTopicRepository topicRepository;
    @Autowired PrepQuestionRepository questionRepository;
    @Autowired PrepReferenceRepository referenceRepository;
    @Autowired PrepPlanWeekRepository planWeekRepository;
    @Autowired StudyProgressRepository progressRepository;

    private final ObjectMapper json = new ObjectMapper();

    @MockitoBean JwtDecoder jwtDecoder;

    private User akhil;
    private User mallory;

    @BeforeEach
    void setUp() {
        progressRepository.deleteAll();
        planWeekRepository.deleteAll();
        questionRepository.deleteAll();
        referenceRepository.deleteAll();
        topicRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();

        akhil = userRepository.save(User.builder()
                .email("akhil@example.com").name("Akhil").role("ROLE_USER").build());
        mallory = userRepository.save(User.builder()
                .email("mallory@example.com").name("Mallory").role("ROLE_USER").build());
    }

    private static RequestPostProcessor as(User user) {
        return jwt().jwt(b -> b.claim("email", user.getEmail()));
    }

    /** A miniature bank with the shapes that matter: a chain, HTML, follow-ups, a plan. */
    private static String bankPayload(String questionKey) {
        return """
            {
              "categories": [
                {"key":"java","name":"Java","blurb":"JVM and language","kind":"knowledge","order":1}
              ],
              "topics": [
                {"key":"java--gc","categoryKey":"java","name":"GC","blurb":"heap",
                 "companyKey":null,"part":1,"order":0}
              ],
              "questions": [
                {"key":"%s","topicKey":"java--gc","categoryKey":"java","companyKey":null,
                 "prompt":"What triggers a minor GC?",
                 "answerHtml":"<p>Eden is <strong>full</strong>.</p><table><tr><td>x</td></tr></table>",
                 "followUps":[{"q":"And a full GC?","a":"<p>Old gen occupancy.</p>"}],
                 "tags":["gc","memory"],"difficulty":"medium","source":"kit"}
              ],
              "references": [
                {"key":"ref-1","topicKey":"java--gc","categoryKey":"java","companyKey":null,
                 "heading":"Generations","level":3,"html":"<p>Young and old.</p>","source":"kit"}
              ],
              "plan": {
                "key":"microsoft-15w",
                "weeks":[
                  {"key":"W0","start":"2026-09-17","end":"2026-09-20","title":"Reset",
                   "weekdays":"diagnostic","weekend":"read the method",
                   "problems":[["Two Sum","two-sum"]],"challenge":"run all four",
                   "videoLabel":"Blind 75","videoQuery":"blind 75 roadmap",
                   "algomaster":"set up","milestone":null,"light":false,"order":0}
                ]
              }
            }
            """.formatted(questionKey);
    }

    private void importFor(User user, String questionKey) throws Exception {
        mvc.perform(post("/api/prep/import").with(as(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bankPayload(questionKey)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.questions").value(1))
                .andExpect(jsonPath("$.planWeeks").value(1));
    }

    @Test
    @DisplayName("import stores the bank and the plan")
    void importStoresEverything() throws Exception {
        importFor(akhil, "q1");

        assertThat(categoryRepository.countByUserId(akhil.getId())).isEqualTo(1);
        assertThat(topicRepository.countByUserId(akhil.getId())).isEqualTo(1);
        assertThat(questionRepository.countByUserId(akhil.getId())).isEqualTo(1);
        assertThat(referenceRepository.countByUserId(akhil.getId())).isEqualTo(1);
        assertThat(planWeekRepository.countByUserId(akhil.getId())).isEqualTo(1);
    }

    @Test
    @DisplayName("re-importing replaces rather than accumulating, so deleted material disappears")
    void importIsAReplace() throws Exception {
        importFor(akhil, "q1");
        importFor(akhil, "q2");

        assertThat(questionRepository.countByUserId(akhil.getId())).isEqualTo(1);
        assertThat(questionRepository.findByUserId(akhil.getId()).get(0).getQuestionKey()).isEqualTo("q2");
    }

    @Test
    @DisplayName("the bank payload carries navigation but not answer bodies")
    void bankOmitsAnswers() throws Exception {
        importFor(akhil, "q1");

        String body = mvc.perform(get("/api/prep/bank").param("planKey", "microsoft-15w").with(as(akhil)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode bank = json.readTree(body);

        assertThat(bank.get("categories")).hasSize(1);
        assertThat(bank.get("topics")).hasSize(1);
        assertThat(bank.get("references")).hasSize(1);
        assertThat(bank.get("questions")).hasSize(1);
        // the stub has the prompt and tags, and no answer field at all
        assertThat(bank.get("questions").get(0).get("prompt").asText()).contains("minor GC");
        assertThat(bank.get("questions").get(0).has("answerHtml")).isFalse();
        assertThat(bank.get("plan").get("weeks").get(0).get("problems").get(0).get(1).asText())
                .isEqualTo("two-sum");
    }

    @Test
    @DisplayName("a topic read returns the answer HTML and follow-ups intact")
    void topicReadRoundTripsHtmlAndFollowUps() throws Exception {
        importFor(akhil, "q1");

        String body = mvc.perform(get("/api/prep/questions/java--gc").with(as(akhil)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode qs = json.readTree(body);

        assertThat(qs).hasSize(1);
        assertThat(qs.get(0).get("answerHtml").asText())
                .contains("<strong>full</strong>")
                .contains("<table>");
        assertThat(qs.get(0).get("followUps")).hasSize(1);
        assertThat(qs.get(0).get("followUps").get(0).get("q").asText()).isEqualTo("And a full GC?");
        assertThat(qs.get(0).get("tags")).hasSize(2);
    }

    @Test
    @DisplayName("search matches answer text, not just the prompt")
    void searchLooksInsideAnswers() throws Exception {
        importFor(akhil, "q1");

        mvc.perform(get("/api/prep/search").param("q", "eden").with(as(akhil)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        mvc.perform(get("/api/prep/search").param("q", "kafka").with(as(akhil)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("one user's bank is invisible to another")
    void banksAreIsolated() throws Exception {
        importFor(akhil, "q1");

        String body = mvc.perform(get("/api/prep/bank").with(as(mallory)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode bank = json.readTree(body);

        assertThat(bank.get("questions")).isEmpty();
        assertThat(bank.get("topics")).isEmpty();
        mvc.perform(get("/api/prep/questions/java--gc").with(as(mallory)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("progress round-trips and its revision advances")
    void progressRoundTrips() throws Exception {
        mvc.perform(get("/api/prep/progress").with(as(akhil)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.revision").value(0));

        mvc.perform(put("/api/prep/progress").with(as(akhil))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"data\":{\"checkins\":{\"2026-09-21\":1},\"starred\":{\"q1\":1}}}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.revision").value(1))
                .andExpect(jsonPath("$.data.checkins['2026-09-21']").value(1));

        mvc.perform(get("/api/prep/progress").with(as(akhil)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.starred.q1").value(1))
                .andExpect(jsonPath("$.revision").value(1));
    }

    @Test
    @DisplayName("a stale write is refused instead of clobbering another device's session")
    void staleWriteIsRefused() throws Exception {
        mvc.perform(put("/api/prep/progress").with(as(akhil))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"data\":{\"checkins\":{\"2026-09-21\":1}}}"))
                .andExpect(status().isOk());

        // laptop still believes it is on revision 0
        mvc.perform(put("/api/prep/progress").with(as(akhil))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"data\":{\"checkins\":{}},\"revision\":0}"))
                .andExpect(status().isConflict());

        // the earlier check-in survived
        mvc.perform(get("/api/prep/progress").with(as(akhil)))
                .andExpect(jsonPath("$.data.checkins['2026-09-21']").value(1));
    }

    @Test
    @DisplayName("progress is per user")
    void progressIsIsolated() throws Exception {
        mvc.perform(put("/api/prep/progress").with(as(akhil))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"data\":{\"checkins\":{\"2026-09-21\":1}}}"))
                .andExpect(status().isOk());

        mvc.perform(get("/api/prep/progress").with(as(mallory)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.revision").value(0));
    }

    @Test
    @DisplayName("an unknown plan is a 404, not an empty body")
    void unknownPlanIs404() throws Exception {
        importFor(akhil, "q1");
        mvc.perform(get("/api/prep/plan/does-not-exist").with(as(akhil)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("the prep routes require a token")
    void anonymousIsRejected() throws Exception {
        mvc.perform(get("/api/prep/bank")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/prep/progress")).andExpect(status().isUnauthorized());
    }
}
