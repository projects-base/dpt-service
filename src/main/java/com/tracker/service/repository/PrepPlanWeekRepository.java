package com.tracker.service.repository;

import com.tracker.service.entity.PrepPlanWeek;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrepPlanWeekRepository extends JpaRepository<PrepPlanWeek, Long> {
    List<PrepPlanWeek> findByUserId(Long userId);
    long countByUserId(Long userId);
    void deleteByUserId(Long userId);
    List<PrepPlanWeek> findByUserIdAndPlanKeyOrderBySortOrderAsc(Long userId, String planKey);
    void deleteByUserIdAndPlanKey(Long userId, String planKey);
}
