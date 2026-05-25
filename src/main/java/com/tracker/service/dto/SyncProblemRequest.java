package com.tracker.service.dto;

/**
 * Request DTO for syncing a problem from the Chrome Extension.
 * Uses the Google OAuth access token (not ID token) for auth.
 */
public record SyncProblemRequest(
        String title,
        String link,
        String difficulty,
        String analysis,
        String intuition,
        String implementation,
        String readability,
        String cleanCode,
        String code,
        String docUrl,
        String tags,
        String question
) {}
