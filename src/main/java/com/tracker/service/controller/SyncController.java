package com.tracker.service.controller;

import com.tracker.service.dto.SyncProblemRequest;
import com.tracker.service.entity.Problem;
import com.tracker.service.entity.User;
import com.tracker.service.service.ProblemService;
import com.tracker.service.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    private final UserService userService;
    private final ProblemService problemService;

    @PostMapping("/problem")
    public ResponseEntity<?> syncProblem(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody SyncProblemRequest req
    ) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Missing or invalid Authorization header"));
        }

        String accessToken = authHeader.substring(7);

        try {
            // Step 1: Identify user via Google UserInfo API
            var client = new org.springframework.web.client.RestTemplate();
            var headers = new org.springframework.http.HttpHeaders();
            headers.setBearerAuth(accessToken);
            var entity = new org.springframework.http.HttpEntity<>(headers);

            @SuppressWarnings("unchecked")
            var userInfo = client.exchange(
                    "https://www.googleapis.com/oauth2/v2/userinfo",
                    org.springframework.http.HttpMethod.GET,
                    entity,
                    Map.class
            ).getBody();

            if (userInfo == null || !userInfo.containsKey("email")) {
                return ResponseEntity.status(401).body(Map.of("error", "Could not fetch user info from Google"));
            }

            String email = (String) userInfo.get("email");
            String name = (String) userInfo.getOrDefault("name", email);
            String picture = (String) userInfo.getOrDefault("picture", null);

            log.info("[Sync] Problem sync from extension for user: {}", email);

            // Step 2: Upsert user
            User user = userService.getOrCreateUser(email, name, picture);

            // Step 3: Build notes from ratings + code + docUrl
            StringBuilder notes = new StringBuilder();
            if (req.analysis() != null && !req.analysis().isBlank())
                notes.append("Analysis: ").append(req.analysis()).append("\n");
            if (req.intuition() != null && !req.intuition().isBlank())
                notes.append("Intuition: ").append(req.intuition()).append("/10\n");
            if (req.implementation() != null && !req.implementation().isBlank())
                notes.append("Implementation: ").append(req.implementation()).append("/10\n");
            if (req.readability() != null && !req.readability().isBlank())
                notes.append("Readability: ").append(req.readability()).append("/10\n");
            if (req.cleanCode() != null && !req.cleanCode().isBlank())
                notes.append("Clean Code: ").append(req.cleanCode()).append("/10\n");
            if (req.docUrl() != null && !req.docUrl().isBlank())
                notes.append("\nGoogle Doc: ").append(req.docUrl());

            // Step 4: Build tags from difficulty/analysis
            String tags = req.difficulty() != null ? req.difficulty().toUpperCase() : null;

            // Step 5: Save problem
            Problem problem = Problem.builder()
                    .title(req.title() != null ? req.title() : "Untitled")
                    .url(req.link())
                    .difficulty(req.difficulty() != null ? req.difficulty().toUpperCase() : "MEDIUM")
                    .notes(notes.toString())
                    .question(req.question())
                    .code(req.code())
                    .tags(tags)
                    .user(user)
                    .build();

            Problem saved = problemService.saveProblem(problem);
            log.info("[Sync] Saved problem '{}' (id={}) for user {}", saved.getTitle(), saved.getId(), email);

            return ResponseEntity.ok(Map.of(
                    "id", saved.getId(),
                    "title", saved.getTitle(),
                    "message", "Problem synced to Supabase successfully"
            ));

        } catch (Exception e) {
            log.error("[Sync] Error syncing problem from extension", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
