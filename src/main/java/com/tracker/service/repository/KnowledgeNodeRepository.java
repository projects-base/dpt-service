package com.tracker.service.repository;

import com.tracker.service.entity.KnowledgeNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KnowledgeNodeRepository extends JpaRepository<KnowledgeNode, Long> {
    List<KnowledgeNode> findByUserId(Long userId);
    Optional<KnowledgeNode> findByUserIdAndNodeKey(Long userId, String nodeKey);
    List<KnowledgeNode> findByUserIdAndCategoryKey(Long userId, String categoryKey);
    long countByUserId(Long userId);
    void deleteByUserId(Long userId);
}
