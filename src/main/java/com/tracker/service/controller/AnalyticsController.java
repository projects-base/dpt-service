package com.tracker.service.controller;

import com.tracker.service.config.CurrentUser;
import com.tracker.service.dto.AnalyticsResponse;
import com.tracker.service.entity.User;
import com.tracker.service.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final CurrentUser currentUser;

    /** Kept for the existing web dashboard; the id must be the caller's own. */
    @GetMapping("/user/{userId}")
    public ResponseEntity<AnalyticsResponse> getUserAnalytics(@AuthenticationPrincipal Jwt jwt,
                                                              @PathVariable Long userId) {
        currentUser.requireSelf(jwt, userId);
        return ResponseEntity.ok(analyticsService.getUserAnalytics(userId));
    }

    /** Analytics for the currently logged-in user. */
    @GetMapping("/me")
    public ResponseEntity<AnalyticsResponse> getMyAnalytics(@AuthenticationPrincipal Jwt jwt) {
        User me = currentUser.require(jwt);
        return ResponseEntity.ok(analyticsService.getUserAnalytics(me.getId()));
    }
}
