package com.tracker.service.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request body for POST /auth/google.
 * The Chrome extension signs in the user via Google and obtains an ID token,
 * then sends it here for backend validation and user upsert.
 */
public record GoogleTokenRequest(
        @NotBlank(message = "Google credential (ID token) must not be blank")
        String credential
) {}
