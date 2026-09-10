package com.tracker.service.repository;

import com.tracker.service.entity.KnowledgeCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KnowledgeCategoryRepository extends JpaRepository<KnowledgeCategory, Long> {
    List<KnowledgeCategory> findByUserId(Long userId);
    Optional<KnowledgeCategory> findByUserIdAndCategoryKey(Long userId, String categoryKey);
    void deleteByUserId(Long userId);
}
