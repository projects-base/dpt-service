package com.tracker.service.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleAllExceptions(Exception ex) {
        Map<String, String> error = new HashMap<>();
        error.put("message", ex.getMessage() != null ? ex.getMessage() : ex.getClass().getName());
        
        StringWriter sw = new StringWriter();
        ex.printStackTrace(new PrintWriter(sw));
        System.err.println("500 ERROR INTERCEPTED: " + sw.toString()); // Print directly to console visibly
        
        // Truncate to first 500 chars to avoid massive JSON
        String trace = sw.toString();
        error.put("trace", trace.substring(0, Math.min(trace.length(), 1000)));
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
