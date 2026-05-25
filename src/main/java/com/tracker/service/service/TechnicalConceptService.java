package com.tracker.service.service;

import com.tracker.service.entity.TechnicalConcept;
import com.tracker.service.repository.TechnicalConceptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TechnicalConceptService {

    private final TechnicalConceptRepository repository;

    public List<TechnicalConcept> getAllConcepts() {
        return repository.findAll();
    }

    public List<TechnicalConcept> getConceptsByCategory(String category) {
        return repository.findByCategory(category);
    }

    public TechnicalConcept saveConcept(TechnicalConcept concept) {
        return repository.save(concept);
    }
}
