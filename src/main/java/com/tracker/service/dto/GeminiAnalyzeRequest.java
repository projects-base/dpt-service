package com.tracker.service.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GeminiAnalyzeRequest {
    private String title;
    private String code;
    private String url;
}
