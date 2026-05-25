package com.tracker.service.repository;

import com.tracker.service.entity.Problem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProblemRepository extends JpaRepository<Problem, Long> {
    List<Problem> findByUserId(Long userId);
    List<Problem> findByUserIdAndDifficulty(Long userId, String difficulty);
}
