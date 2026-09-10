package com.tracker.service.exception;

/**
 * Thrown when the authenticated user is not allowed to touch a resource
 * (e.g. another user's problem). Mapped to HTTP 403.
 */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
