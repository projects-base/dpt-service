package com.tracker.service.service;

import com.tracker.service.dto.AnalyticsResponse;
import com.tracker.service.entity.Problem;
import com.tracker.service.repository.ProblemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final ProblemRepository problemRepository;

    public AnalyticsResponse getUserAnalytics(Long userId) {
        List<Problem> problems = problemRepository.findByUserId(userId);

        long easy = problems.stream().filter(p -> "EASY".equalsIgnoreCase(p.getDifficulty())).count();
        long medium = problems.stream().filter(p -> "MEDIUM".equalsIgnoreCase(p.getDifficulty())).count();
        long hard = problems.stream().filter(p -> "HARD".equalsIgnoreCase(p.getDifficulty())).count();

        // Calculate streak
        int streak = calculateStreak(problems);

        return AnalyticsResponse.builder()
                .totalProblems(problems.size())
                .easyCount(easy)
                .mediumCount(medium)
                .hardCount(hard)
                .streak(streak)
                .build();
    }

    private int calculateStreak(List<Problem> problems) {
        if (problems.isEmpty()) return 0;

        List<LocalDate> sortedDates = problems.stream()
                .map(p -> p.getSolvedAt() != null ? p.getSolvedAt().toLocalDate() : p.getCreatedDate().toLocalDate())
                .distinct()
                .sorted(Comparator.reverseOrder())
                .collect(Collectors.toList());

        int streak = 0;
        LocalDate current = LocalDate.now();

        for (LocalDate d : sortedDates) {
            long diff = java.time.temporal.ChronoUnit.DAYS.between(d, current);
            if (diff == 0 || diff == 1) {
                streak++;
                current = d;
            } else {
                break;
            }
        }
        return streak;
    }
}
