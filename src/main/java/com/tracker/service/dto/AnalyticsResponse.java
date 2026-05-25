package com.tracker.service.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyticsResponse {
    private long totalProblems;
    private long easyCount;
    private long mediumCount;
    private long hardCount;
    private int streak;
}
