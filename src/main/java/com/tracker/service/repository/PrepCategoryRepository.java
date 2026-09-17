package com.tracker.service.repository;

import com.tracker.service.entity.PrepCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrepCategoryRepository extends JpaRepository<PrepCategory, Long> {
    List<PrepCategory> findByUserId(Long userId);
    long countByUserId(Long userId);
    void deleteByUserId(Long userId);

}
