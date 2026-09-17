package com.tracker.service.repository;

import com.tracker.service.entity.StudyProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudyProgressRepository extends JpaRepository<StudyProgress, Long> {
    Optional<StudyProgress> findByUserId(Long userId);
    void deleteByUserId(Long userId);
}
