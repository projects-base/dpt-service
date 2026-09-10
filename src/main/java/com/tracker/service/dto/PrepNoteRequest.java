package com.tracker.service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Client-supplied fields for a prep note. The author is always taken from the
 * caller's token, never from the request body.
 */
public record PrepNoteRequest(
        @NotBlank(message = "title must not be blank")
        @Size(max = 255, message = "title must be at most 255 characters")
        String title,

        @NotBlank(message = "content must not be blank")
        String content,

        Boolean isPublic
) {}
