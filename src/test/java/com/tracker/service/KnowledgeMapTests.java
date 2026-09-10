package com.tracker.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tracker.service.entity.User;
import com.tracker.service.repository.KnowledgeCategoryRepository;
import com.tracker.service.repository.KnowledgeEdgeRepository;
import com.tracker.service.repository.KnowledgeNodeRepository;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * The knowledge map used to live only in the browser's localStorage. These
 * cover the stored version: seeding, per-user isolation, and the guard that
 * stops a stale browser copy from overwriting a real map.
 */
@SpringBootTest
@AutoConfigureMockMvc
class KnowledgeMapTests {

    @Autowired MockMvc mvc;
    @Autowired UserRepository userRepository;
    @Autowired KnowledgeNodeRepository nodeRepository;
    @Autowired KnowledgeEdgeRepository edgeRepository;
    @Autowired KnowledgeCategoryRepository categoryRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean JwtDecoder jwtDecoder;

    private User alice;
    private User mallory;

    @BeforeEach
    void setUp() {
        edgeRepository.deleteAll();
        nodeRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();

        alice = userRepository.save(User.builder()
                .email("alice@example.com").name("Alice").role("ROLE_USER").build());
        mallory = userRepository.save(User.builder()
                .email("mallory@example.com").name("Mallory").role("ROLE_USER").build());
    }

    private static RequestPostProcessor as(User user) {
        return jwt().jwt(b -> b.claim("email", user.getEmail()));
    }

    private JsonNode graphOf(User user) throws Exception {
        String body = mvc.perform(get("/api/knowledge").with(as(user)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body);
    }

    @Test
    @DisplayName("a new user gets a seeded starter map")
    void firstOpenSeedsStarterMap() throws Exception {
        JsonNode graph = graphOf(alice);

        assertThat(graph.get("nodes")).hasSize(5);          // root + 4 pillars
        assertThat(graph.get("edges")).hasSize(4);
        assertThat(graph.get("categories")).hasSize(4);
        assertThat(graph.get("nodes").get(0).get("kind").asText()).isEqualTo("ROOT");
    }

    @Test
    @DisplayName("opening the map twice does not seed it twice")
    void seedingIsIdempotent() throws Exception {
        graphOf(alice);
        JsonNode second = graphOf(alice);
        assertThat(second.get("nodes")).hasSize(5);
        assertThat(nodeRepository.countByUserId(alice.getId())).isEqualTo(5);
    }

    @Test
    @DisplayName("a saved resource is linked to its category pillar and survives reload")
    void addedNodeIsPersistedAndLinked() throws Exception {
        graphOf(alice);

        mvc.perform(post("/api/knowledge/nodes")
                        .with(as(alice))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"label":"CAP Theorem","url":"https://example.com/cap","categoryKey":"system"}
                            """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.label").value("CAP Theorem"))
                .andExpect(jsonPath("$.kind").value("RESOURCE"));

        JsonNode graph = graphOf(alice);
        assertThat(graph.get("nodes")).hasSize(6);

        boolean linked = false;
        for (JsonNode e : graph.get("edges")) {
            if (e.get("from").asText().equals("pillar_system")) linked = true;
        }
        assertThat(linked).as("resource hangs off its category pillar").isTrue();
    }

    @Test
    @DisplayName("one user's map is invisible to another")
    void mapsArePerUser() throws Exception {
        graphOf(alice);
        mvc.perform(post("/api/knowledge/nodes")
                        .with(as(alice))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"label":"Alice private note","categoryKey":"system"}
                            """))
                .andExpect(status().isOk());

        JsonNode malloryGraph = graphOf(mallory);
        for (JsonNode n : malloryGraph.get("nodes")) {
            assertThat(n.get("label").asText()).isNotEqualTo("Alice private note");
        }
        assertThat(malloryGraph.get("nodes")).hasSize(5); // her own fresh starter map
    }

    @Test
    @DisplayName("a user cannot delete a node belonging to someone else")
    void cannotDeleteAnotherUsersNode() throws Exception {
        graphOf(alice);
        String created = mvc.perform(post("/api/knowledge/nodes")
                        .with(as(alice))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"label":"Alice resource","categoryKey":"system"}
                            """))
                .andReturn().getResponse().getContentAsString();
        String nodeKey = objectMapper.readTree(created).get("nodeKey").asText();

        graphOf(mallory);
        mvc.perform(delete("/api/knowledge/nodes/{key}", nodeKey).with(as(mallory)))
                .andExpect(status().isNotFound());

        assertThat(nodeRepository.findByUserIdAndNodeKey(alice.getId(), nodeKey)).isPresent();
    }

    @Test
    @DisplayName("deleting a resource removes its edges too")
    void deleteRemovesEdges() throws Exception {
        graphOf(alice);
        String created = mvc.perform(post("/api/knowledge/nodes")
                        .with(as(alice))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"label":"Temp","categoryKey":"article"}
                            """))
                .andReturn().getResponse().getContentAsString();
        String nodeKey = objectMapper.readTree(created).get("nodeKey").asText();

        mvc.perform(delete("/api/knowledge/nodes/{key}", nodeKey).with(as(alice)))
                .andExpect(status().isNoContent());

        JsonNode graph = graphOf(alice);
        assertThat(graph.get("nodes")).hasSize(5);
        assertThat(graph.get("edges")).hasSize(4);
    }

    @Test
    @DisplayName("the root node cannot be deleted")
    void rootIsProtected() throws Exception {
        graphOf(alice);
        mvc.perform(delete("/api/knowledge/nodes/{key}", "root").with(as(alice)))
                .andExpect(status().isForbidden());
        assertThat(nodeRepository.findByUserIdAndNodeKey(alice.getId(), "root")).isPresent();
    }

    @Test
    @DisplayName("a new category creates its own pillar off the root")
    void addCategoryCreatesPillar() throws Exception {
        graphOf(alice);

        String body = mvc.perform(post("/api/knowledge/categories")
                        .with(as(alice))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"label":"Databases","icon":"🗄"}
                            """))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String pillarKey = objectMapper.readTree(body).get("pillarNodeKey").asText();
        assertThat(nodeRepository.findByUserIdAndNodeKey(alice.getId(), pillarKey)).isPresent();

        JsonNode graph = graphOf(alice);
        assertThat(graph.get("categories")).hasSize(5);
        assertThat(graph.get("nodes")).hasSize(6);
    }

    @Test
    @DisplayName("duplicate category labels are rejected")
    void duplicateCategoryRejected() throws Exception {
        graphOf(alice);
        mvc.perform(post("/api/knowledge/categories")
                        .with(as(alice))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"label\":\"Article\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("deleting a category takes its pillar and everything filed under it")
    void deleteCategoryCascades() throws Exception {
        graphOf(alice);
        mvc.perform(post("/api/knowledge/nodes")
                        .with(as(alice))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"label\":\"An article\",\"categoryKey\":\"article\"}"))
                .andExpect(status().isOk());

        mvc.perform(delete("/api/knowledge/categories/{key}", "article").with(as(alice)))
                .andExpect(status().isNoContent());

        JsonNode graph = graphOf(alice);
        assertThat(graph.get("categories")).hasSize(3);
        for (JsonNode n : graph.get("nodes")) {
            assertThat(n.get("label").asText()).isNotEqualTo("An article");
        }
    }

    @Test
    @DisplayName("a localStorage map is adopted on first import")
    void importAdoptsBrowserMap() throws Exception {
        graphOf(alice); // seeds the starter map

        String payload = """
            {
              "categories": [
                {"categoryKey":"system","label":"System Design","icon":"🏗",
                 "pillarNodeKey":"p2","colorBg":"#1e1b4b","colorBorder":"#3730a3",
                 "colorFont":"#a5b4fc","builtIn":true}
              ],
              "nodes": [
                {"nodeKey":"1","label":"My Brain","icon":"🧠","kind":"ROOT"},
                {"nodeKey":"p2","label":"System Design","icon":"🏗","kind":"PILLAR","categoryKey":"system"},
                {"nodeKey":"6","label":"Load Balancing","url":"https://example.com/lb",
                 "kind":"RESOURCE","categoryKey":"system"}
              ],
              "edges": [ {"from":"1","to":"p2"}, {"from":"p2","to":"6"} ]
            }
            """;

        mvc.perform(post("/api/knowledge/import")
                        .with(as(alice))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imported").value(true));

        JsonNode graph = graphOf(alice);
        assertThat(graph.get("nodes")).hasSize(3);

        boolean found = false;
        for (JsonNode n : graph.get("nodes")) {
            if (n.get("label").asText().equals("Load Balancing")) found = true;
        }
        assertThat(found).isTrue();
    }

    @Test
    @DisplayName("import will not overwrite a map that already has saved resources")
    void importDoesNotClobberRealWork() throws Exception {
        graphOf(alice);
        mvc.perform(post("/api/knowledge/nodes")
                        .with(as(alice))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"label\":\"Hard-won note\",\"categoryKey\":\"system\"}"))
                .andExpect(status().isOk());

        // A second device shows up with its own stale local copy.
        String stale = """
            {"nodes":[{"nodeKey":"1","label":"Stale root","kind":"ROOT"}],
             "edges":[], "categories":[]}
            """;

        mvc.perform(post("/api/knowledge/import")
                        .with(as(alice))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(stale))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imported").value(false));

        JsonNode graph = graphOf(alice);
        boolean survived = false;
        for (JsonNode n : graph.get("nodes")) {
            if (n.get("label").asText().equals("Hard-won note")) survived = true;
        }
        assertThat(survived).as("existing work must not be replaced").isTrue();
    }

    @Test
    @DisplayName("saving the same link into the same branch twice is a no-op")
    void duplicateLinkInSameCategoryIsDeduped() throws Exception {
        graphOf(alice);
        String body = """
            {"label":"AlgoMaster","url":"https://algomaster.io/","categoryKey":"youtube"}
            """;

        String first = mvc.perform(post("/api/knowledge/nodes").with(as(alice))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String second = mvc.perform(post("/api/knowledge/nodes").with(as(alice))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertThat(objectMapper.readTree(second).get("nodeKey").asText())
                .as("the existing node is returned, not a second copy")
                .isEqualTo(objectMapper.readTree(first).get("nodeKey").asText());

        assertThat(graphOf(alice).get("nodes")).hasSize(6); // 5 seeded + 1
    }

    @Test
    @DisplayName("the same link filed under a different branch is still allowed")
    void sameLinkDifferentCategoryIsKept() throws Exception {
        graphOf(alice);
        for (String cat : new String[] {"youtube", "article"}) {
            mvc.perform(post("/api/knowledge/nodes").with(as(alice))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"label\":\"AlgoMaster\",\"url\":\"https://algomaster.io/\","
                                   + "\"categoryKey\":\"" + cat + "\"}"))
                    .andExpect(status().isOk());
        }
        assertThat(graphOf(alice).get("nodes")).hasSize(7); // 5 seeded + 2
    }

    @Test
    @DisplayName("the map requires authentication")
    void anonymousRejected() throws Exception {
        mvc.perform(get("/api/knowledge")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/knowledge/nodes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"label\":\"x\",\"categoryKey\":\"system\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("a blank label is rejected")
    void blankLabelRejected() throws Exception {
        graphOf(alice);
        mvc.perform(post("/api/knowledge/nodes")
                        .with(as(alice))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"label\":\"   \",\"categoryKey\":\"system\"}"))
                .andExpect(status().isBadRequest());
    }
}
