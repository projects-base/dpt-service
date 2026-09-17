package com.tracker.service.repository;

import com.tracker.service.entity.PrepReference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrepReferenceRepository extends JpaRepository<PrepReference, Long> {
    List<PrepReference> findByUserId(Long userId);
    long countByUserId(Long userId);
    void deleteByUserId(Long userId);
    List<PrepReference> findByUserIdAndTopicKey(Long userId, String topicKey);
}
