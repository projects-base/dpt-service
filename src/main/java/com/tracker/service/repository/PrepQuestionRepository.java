package com.tracker.service.repository;

import com.tracker.service.entity.PrepQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrepQuestionRepository extends JpaRepository<PrepQuestion, Long> {
    List<PrepQuestion> findByUserId(Long userId);
    long countByUserId(Long userId);
    void deleteByUserId(Long userId);
    List<PrepQuestion> findByUserIdAndTopicKey(Long userId, String topicKey);
    List<PrepQuestion> findByUserIdAndCompanyKey(Long userId, String companyKey);
}
