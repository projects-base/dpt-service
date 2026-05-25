package com.tracker.service.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GeminiAnalyzeResponse {
    private String difficulty;
    private String analysis;
    private Integer intuition;
    private Integer implementation;
    private Integer readability;
    private Integer cleanCode;
    private String suggestions;
}
