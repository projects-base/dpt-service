package com.tracker.service.controller;

import com.tracker.service.exception.ConflictException;
import com.tracker.service.exception.ForbiddenException;
import com.tracker.service.exception.NotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.ErrorResponseException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(NotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", ex.getMessage()));
    }

    /** A write that would overwrite unseen state. The client re-reads and merges. */
    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<Map<String, String>> handleConflict(ConflictException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler({ForbiddenException.class, AccessDeniedException.class})
    public ResponseEntity<Map<String, String>> handleForbidden(Exception ex) {
        log.warn("Access denied: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", ex.getMessage()));
    }

    /** Bean-validation failures on @Valid request bodies. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        String detail = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return ResponseEntity.badRequest()
                .body(Map.of("message", detail.isEmpty() ? "Invalid request body" : detail));
    }

    /**
     * Spring's own typed errors (404 for unknown routes, 405, 415, ...) already
     * carry the right status — let them through instead of relabelling them 500.
     */
    @ExceptionHandler(ErrorResponseException.class)
    public ResponseEntity<Map<String, String>> handleErrorResponse(ErrorResponseException ex) {
        return ResponseEntity.status(ex.getStatusCode())
                .body(Map.of("message", ex.getBody().getDetail() != null
                        ? ex.getBody().getDetail()
                        : ex.getBody().getTitle()));
    }

    /**
     * Anything unanticipated. The real cause goes to the log, never to the
     * client — raw exception messages leak SQL, hostnames and stack detail.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleAllExceptions(Exception ex) {
        log.error("Unhandled exception: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "An unexpected error occurred. Please try again."));
    }
}
