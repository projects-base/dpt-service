package com.tracker.service.controller;

import com.tracker.service.dto.SyncProblemRequest;
import com.tracker.service.entity.Problem;
import com.tracker.service.entity.User;
import com.tracker.service.service.ProblemService;
import com.tracker.service.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Accepts problem submissions from the Chrome Extension.
 *
 * Auth flow: Extension sends a Google OAuth access token (not ID token).
 * We validate it by calling Google's UserInfo API, then upsert the user
 * and save the problem to Supabase.
 *
 * POST /api/sync/problem
 * Header: Authorization: Bearer <google_access_token>
 */
@Slf4j
@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
public class SyncController {

    private static final String USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v2/userinfo";

    private final UserService userService;
    private final ProblemService problemService;

    /** One shared client rather than a fresh RestTemplate per request. */
    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/problem")
    public ResponseEntity<?> syncProblem(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody SyncProblemRequest req
    ) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Missing or invalid Authorization header"));
        }

        String accessToken = authHeader.substring(7);

        // Step 1: Identify the user via Google's UserInfo API.
        Map<?, ?> userInfo;
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            userInfo = restTemplate.exchange(
                    USERINFO_ENDPOINT,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    Map.class
            ).getBody();
        } catch (RestClientException e) {
            // An expired or revoked access token is a client problem, not a server
            // fault. Returning 500 here made the extension log a generic sync
            // failure when the actual fix is to re-authenticate.
            log.warn("[Sync] Google rejected the access token: {}", e.getMessage());
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Google rejected the access token. Please sign in again."));
        }

        if (userInfo == null || !(userInfo.get("email") instanceof String email) || email.isBlank()) {
            return ResponseEntity.status(401).body(Map.of("error", "Could not fetch user info from Google"));
        }

        try {
            String name = userInfo.get("name") instanceof String n ? n : email;
            String picture = userInfo.get("picture") instanceof String pic ? pic : null;

            log.info("[Sync] Problem sync from extension for user: {}", email);

            // Step 2: Upsert user
            User user = userService.getOrCreateUser(email, name, picture);

            // Step 3: Build notes from ratings + docUrl.
            // The extension substitutes the literal "N/A" for every field the user
            // left blank, so those are filtered out here rather than stored as
            // "Intuition: N/A/10".
            StringBuilder notes = new StringBuilder();
            appendIfPresent(notes, "Analysis: ", req.analysis(), "");
            appendIfPresent(notes, "Intuition: ", req.intuition(), "/10");
            appendIfPresent(notes, "Implementation: ", req.implementation(), "/10");
            appendIfPresent(notes, "Readability: ", req.readability(), "/10");
            appendIfPresent(notes, "Clean Code: ", req.cleanCode(), "/10");
            if (present(req.docUrl())) {
                notes.append("\nGoogle Doc: ").append(req.docUrl().trim());
            }

            // Step 4: Save. ProblemService normalizes the difficulty and strips
            // the remaining "N/A" placeholders out of the free-text columns.
            Problem problem = Problem.builder()
                    .title(present(req.title()) ? req.title().trim() : "Untitled")
                    .url(present(req.link()) ? req.link().trim() : null)
                    .difficulty(req.difficulty())
                    .notes(notes.isEmpty() ? null : notes.toString())
                    .question(present(req.question()) ? req.question() : null)
                    .code(present(req.code()) ? req.code() : null)
                    .tags(present(req.tags()) ? req.tags().trim() : null)
                    .user(user)
                    .build();

            Problem saved = problemService.saveProblem(problem);
            log.info("[Sync] Saved problem '{}' (id={}) for user {}", saved.getTitle(), saved.getId(), email);

            return ResponseEntity.ok(Map.of(
                    "id", saved.getId(),
                    "title", saved.getTitle(),
                    "message", "Problem synced successfully"
            ));

        } catch (Exception e) {
            log.error("[Sync] Error syncing problem from extension", e);
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Could not save the problem. Please try again."));
        }
    }

    /** True when the client sent a real value rather than blank or its "N/A" placeholder. */
    private static boolean present(String value) {
        return value != null && !value.isBlank() && !"N/A".equalsIgnoreCase(value.trim());
    }

    private static void appendIfPresent(StringBuilder sb, String label, String value, String suffix) {
        if (present(value)) {
            sb.append(label).append(value.trim()).append(suffix).append("\n");
        }
    }
}
