package com.tracker.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tracker.service.entity.Problem;
import com.tracker.service.entity.User;
import com.tracker.service.repository.KnowledgeCategoryRepository;
import com.tracker.service.repository.KnowledgeEdgeRepository;
import com.tracker.service.repository.KnowledgeNodeRepository;
import com.tracker.service.repository.ProblemRepository;
import com.tracker.service.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * These endpoints used to trust a userId taken from the path or the request
 * body, so any signed-in user could read, overwrite and delete anyone else's
 * problems. Each test below fails against that old behaviour.
 */
@SpringBootTest
@AutoConfigureMockMvc
class OwnershipSecurityTests {

    @Autowired MockMvc mvc;
    @Autowired UserRepository userRepository;
    @Autowired ProblemRepository problemRepository;
    @Autowired KnowledgeNodeRepository knowledgeNodeRepository;
    @Autowired KnowledgeEdgeRepository knowledgeEdgeRepository;
    @Autowired KnowledgeCategoryRepository knowledgeCategoryRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /** Replaced so the context does not fetch Google's JWKS at startup. */
    @MockitoBean JwtDecoder jwtDecoder;

    private User alice;
    private User mallory;
    private Problem aliceProblem;

    @BeforeEach
    void setUp() {
        problemRepository.deleteAll();
        // Knowledge rows reference users, so they go first.
        knowledgeEdgeRepository.deleteAll();
        knowledgeNodeRepository.deleteAll();
        knowledgeCategoryRepository.deleteAll();
        userRepository.deleteAll();

        alice = userRepository.save(User.builder()
                .email("alice@example.com").name("Alice").role("ROLE_USER").build());
        mallory = userRepository.save(User.builder()
                .email("mallory@example.com").name("Mallory").role("ROLE_USER").build());

        aliceProblem = problemRepository.save(Problem.builder()
                .title("Two Sum").difficulty("EASY").user(alice).build());
    }

    /** A validated Google ID token for the given account. */
    private static RequestPostProcessor as(User user) {
        return jwt().jwt(builder -> builder.claim("email", user.getEmail()));
    }

    @Test
    @DisplayName("a user can read their own problems")
    void ownerCanListOwnProblems() throws Exception {
        mvc.perform(get("/api/problems/user/{id}", alice.getId()).with(as(alice)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Two Sum"));
    }

    @Test
    @DisplayName("a user cannot list another user's problems")
    void strangerCannotListOthersProblems() throws Exception {
        mvc.perform(get("/api/problems/user/{id}", alice.getId()).with(as(mallory)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("a user cannot read another user's problem by id")
    void strangerCannotReadOthersProblem() throws Exception {
        mvc.perform(get("/api/problems/{id}", aliceProblem.getId()).with(as(mallory)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("a user cannot delete another user's problem")
    void strangerCannotDeleteOthersProblem() throws Exception {
        mvc.perform(delete("/api/problems/{id}", aliceProblem.getId()).with(as(mallory)))
                .andExpect(status().isForbidden());

        assertThat(problemRepository.findById(aliceProblem.getId())).isPresent();
    }

    @Test
    @DisplayName("a user cannot edit another user's problem")
    void strangerCannotEditOthersProblem() throws Exception {
        mvc.perform(put("/api/problems/{id}", aliceProblem.getId())
                        .with(as(mallory))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("title", "pwned"))))
                .andExpect(status().isForbidden());

        assertThat(problemRepository.findById(aliceProblem.getId()).orElseThrow().getTitle())
                .isEqualTo("Two Sum");
    }

    @Test
    @DisplayName("a user cannot read another user's analytics")
    void strangerCannotReadOthersAnalytics() throws Exception {
        mvc.perform(get("/api/analytics/user/{id}", alice.getId()).with(as(mallory)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("a created problem is owned by the caller, not by the id in the body")
    void createIgnoresUserIdInBody() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "title", "Planted",
                "difficulty", "HARD",
                // The old controller bound the entity directly and honoured this.
                "user", Map.of("id", alice.getId())
        ));

        mvc.perform(post("/api/problems")
                        .with(as(mallory))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        assertThat(problemRepository.findByUserId(alice.getId()))
                .as("the row must not land on Alice's account")
                .hasSize(1);
        assertThat(problemRepository.findByUserId(mallory.getId()))
                .extracting(Problem::getTitle)
                .containsExactly("Planted");
    }

    @Test
    @DisplayName("a client-supplied id cannot overwrite an existing problem")
    void createCannotOverwriteById() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "id", aliceProblem.getId(),
                "title", "Overwritten",
                "difficulty", "HARD"
        ));

        mvc.perform(post("/api/problems")
                        .with(as(mallory))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        assertThat(problemRepository.findById(aliceProblem.getId()).orElseThrow().getTitle())
                .isEqualTo("Two Sum");
    }

    @Test
    @DisplayName("writing to the shared concept catalogue requires an admin")
    void conceptWritesRequireAuth() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("name", "Injected"));

        // Anonymous: was permitAll under /api/public/**
        mvc.perform(post("/api/concepts")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnauthorized());

        // Signed in, but not an admin
        mvc.perform(post("/api/concepts")
                        .with(as(mallory))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("reading the concept catalogue stays public")
    void conceptReadsArePublic() throws Exception {
        mvc.perform(get("/api/concepts")).andExpect(status().isOk());
    }

    @Test
    @DisplayName("unauthenticated callers get 401, not data")
    void anonymousIsRejected() throws Exception {
        mvc.perform(get("/api/problems/user/{id}", alice.getId()))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/users/me")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("settings update tolerates omitted boolean fields")
    void settingsUpdateAllowsPartialBody() throws Exception {
        // Omitting openDoc/openSheet used to unbox null and return 500.
        mvc.perform(put("/api/users/me/settings")
                        .with(as(alice))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sheetUrl\":\"https://docs.google.com/spreadsheets/d/abc/edit\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sheetUrl").value("https://docs.google.com/spreadsheets/d/abc/edit"));
    }

    @Test
    @DisplayName("a blank title is rejected instead of stored")
    void blankTitleRejected() throws Exception {
        mvc.perform(post("/api/problems")
                        .with(as(alice))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"  \",\"difficulty\":\"EASY\"}"))
                .andExpect(status().isBadRequest());
    }
}
