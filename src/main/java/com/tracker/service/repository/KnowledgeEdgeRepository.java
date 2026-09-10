package com.tracker.service.repository;

import com.tracker.service.entity.KnowledgeEdge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KnowledgeEdgeRepository extends JpaRepository<KnowledgeEdge, Long> {
    List<KnowledgeEdge> findByUserId(Long userId);
    List<KnowledgeEdge> findByUserIdAndFromKeyOrUserIdAndToKey(
            Long userIdA, String fromKey, Long userIdB, String toKey);
    void deleteByUserId(Long userId);
}
