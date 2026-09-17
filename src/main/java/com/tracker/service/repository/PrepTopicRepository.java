package com.tracker.service.repository;

import com.tracker.service.entity.PrepTopic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrepTopicRepository extends JpaRepository<PrepTopic, Long> {
    List<PrepTopic> findByUserId(Long userId);
    long countByUserId(Long userId);
    void deleteByUserId(Long userId);
    List<PrepTopic> findByUserIdAndCategoryKey(Long userId, String categoryKey);
}
