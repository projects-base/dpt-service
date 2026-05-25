package com.tracker.service.controller;

import com.tracker.service.dto.GeminiAnalyzeRequest;
import com.tracker.service.dto.GeminiAnalyzeResponse;
import com.tracker.service.dto.GeminiChatRequest;
import com.tracker.service.dto.GeminiChatResponse;
import com.tracker.service.service.GeminiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/gemini")
@RequiredArgsConstructor
public class GeminiController {

    private final GeminiService geminiService;

    @PostMapping("/analyze")
    public ResponseEntity<GeminiAnalyzeResponse> analyzeCode(@AuthenticationPrincipal Jwt jwt, @RequestBody GeminiAnalyzeRequest request) {
        try {
            String email = jwt.getClaimAsString("email");
            GeminiAnalyzeResponse response = geminiService.analyzeCode(request, email);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/chat")
    public ResponseEntity<GeminiChatResponse> chat(@AuthenticationPrincipal Jwt jwt, @RequestBody GeminiChatRequest request) {
        try {
            String email = jwt.getClaimAsString("email");
            GeminiChatResponse response = geminiService.chat(request, email);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
