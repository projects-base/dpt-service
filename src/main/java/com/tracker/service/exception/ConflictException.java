package com.tracker.service.exception;

/**
 * Thrown when a write would clobber state the caller has not seen. Mapped to
 * HTTP 409 so the client knows to re-read and merge rather than retry blindly.
 */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
