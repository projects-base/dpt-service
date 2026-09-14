package com.tracker.service.controller;

import com.tracker.service.dto.GeminiAnalyzeRequest;
import com.tracker.service.dto.GeminiAnalyzeResponse;
import com.tracker.service.dto.GeminiChatRequest;
import com.tracker.service.dto.GeminiChatResponse;
import com.tracker.service.service.GeminiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Gemini-backed analysis and chat.
 *
 * Both routes used to catch everything and return
 * {@code internalServerError().build()} — a 500 with an empty body. The
 * dashboard rendered that as "API Error:" followed by nothing, so a missing
 * key, a rejected key and a quota trip were indistinguishable. The cause now
 * reaches the client with a status that matches it.
 */
@RestController
@RequestMapping("/api/gemini")
@RequiredArgsConstructor
public class GeminiController {

    private final GeminiService geminiService;

    @PostMapping("/analyze")
    public ResponseEntity<?> analyzeCode(@AuthenticationPrincipal Jwt jwt,
                                         @RequestBody GeminiAnalyzeRequest request) {
        String email = jwt.getClaimAsString("email");
        GeminiAnalyzeResponse response = geminiService.analyzeCode(request, email);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/chat")
    public ResponseEntity<?> chat(@AuthenticationPrincipal Jwt jwt,
                                  @RequestBody GeminiChatRequest request) {
        String email = jwt.getClaimAsString("email");
        GeminiChatResponse response = geminiService.chat(request, email);
        return ResponseEntity.ok(response);
    }

    /**
     * Models this user's key can call, for the Settings picker.
     *
     * Availability varies by key, project and region — a name the key cannot
     * use comes back from Gemini as a bare 404 — so the list is fetched rather
     * than hard-coded.
     */
    @GetMapping("/models")
    public ResponseEntity<?> listModels(@AuthenticationPrincipal Jwt jwt) {
        String email = jwt.getClaimAsString("email");
        return ResponseEntity.ok(Map.of("models", geminiService.listModels(email)));
    }

    /** Missing or unusable key — the caller can fix it, so 400 not 500. */
    @ExceptionHandler(GeminiService.GeminiConfigurationException.class)
    public ResponseEntity<Map<String, String>> handleConfig(GeminiService.GeminiConfigurationException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }

    /** Gemini refused or was unreachable: an upstream failure, so 502. */
    @ExceptionHandler(GeminiService.GeminiUpstreamException.class)
    public ResponseEntity<Map<String, String>> handleUpstream(GeminiService.GeminiUpstreamException e) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("message", e.getMessage()));
    }
}
