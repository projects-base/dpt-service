package com.tracker.service.controller;

import com.tracker.service.dto.AnalyticsResponse;
import com.tracker.service.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<AnalyticsResponse> getUserAnalytics(@PathVariable Long userId) {
        return ResponseEntity.ok(analyticsService.getUserAnalytics(userId));
    }
}
