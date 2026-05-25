package com.tracker.service.dto;

/**
 * Response returned after successful Google token validation.
 * Contains the persisted user profile so the extension can cache it locally.
 */
public record AuthResponse(
        Long id,
        String email,
        String name,
        String pictureUrl,
        String role,
        String sheetUrl,
        String folderId,
        String googleApiKey,
        Boolean openDoc,
        Boolean openSheet
) {}
