package com.tracker.service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/**
 * Client-supplied fields for creating or updating a problem.
 *
 * Deliberately does NOT expose {@code id} or {@code user} — the owner is always
 * taken from the caller's token, so a client cannot write a row onto someone
 * else's account or overwrite an existing row by passing an id.
 */
public record ProblemRequest(
        @NotBlank(message = "title must not be blank")
        @Size(max = 255, message = "title must be at most 255 characters")
        String title,

        @Size(max = 2048, message = "url must be at most 2048 characters")
        String url,

        String difficulty,
        String notes,
        String question,
        String code,

        @Size(max = 255, message = "tags must be at most 255 characters")
        String tags,

        LocalDateTime solvedAt
) {}
