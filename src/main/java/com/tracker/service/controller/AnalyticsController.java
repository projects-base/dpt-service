package com.tracker.service.controller;

import com.tracker.service.dto.AnalyticsResponse;
import com.tracker.service.service.AnalyticsService;
import com.tracker.service.service.UserService;
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
    private final UserService userService;

    /** By userId path param — used internally / by admin. */
    @GetMapping("/user/{userId}")
    public ResponseEntity<AnalyticsResponse> getUserAnalytics(@PathVariable Long userId) {
        return ResponseEntity.ok(analyticsService.getUserAnalytics(userId));
    }

    /** Authenticated shortcut — returns analytics for the currently logged-in user. */
    @GetMapping("/me")
    public ResponseEntity<?> getMyAnalytics(@AuthenticationPrincipal Jwt jwt) {
        String email = jwt.getClaimAsString("email");
        return userService.findByEmail(email)
                .<ResponseEntity<?>>map(user -> ResponseEntity.ok(analyticsService.getUserAnalytics(user.getId())))
                .orElse(ResponseEntity.status(404).body("User not found"));
    }
}
