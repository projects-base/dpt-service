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

    public TechnicalConcept updateConcept(Long id, TechnicalConcept patch) {
        return repository.findById(id).map(existing -> {
            if (patch.getName()        != null) existing.setName(patch.getName());
            if (patch.getDescription() != null) existing.setDescription(patch.getDescription());
            if (patch.getResourceUrl() != null) existing.setResourceUrl(patch.getResourceUrl());
            if (patch.getCategory()    != null) existing.setCategory(patch.getCategory());
            if (patch.getLevel()       != null) existing.setLevel(patch.getLevel());
            return repository.save(existing);
        }).orElseThrow(() -> new RuntimeException("TechnicalConcept not found: " + id));
    }

    public void deleteConcept(Long id) {
        repository.deleteById(id);
    }
}
