package com.tracker.service.repository;

import com.tracker.service.entity.TechnicalConcept;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TechnicalConceptRepository extends JpaRepository<TechnicalConcept, Long> {
    List<TechnicalConcept> findByCategory(String category);
    List<TechnicalConcept> findByLevel(String level);
}
