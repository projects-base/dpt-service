package com.tracker.service.controller;

import com.tracker.service.entity.TechnicalConcept;
import com.tracker.service.service.TechnicalConceptService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public/concepts")
@RequiredArgsConstructor
public class TechnicalConceptController {

    private final TechnicalConceptService conceptService;

    @GetMapping
    public ResponseEntity<List<TechnicalConcept>> getAllConcepts() {
        return ResponseEntity.ok(conceptService.getAllConcepts());
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<TechnicalConcept>> getByCategory(@PathVariable String category) {
        return ResponseEntity.ok(conceptService.getConceptsByCategory(category));
    }

    @PostMapping
    public ResponseEntity<TechnicalConcept> addConcept(@RequestBody TechnicalConcept concept) {
        return ResponseEntity.ok(conceptService.saveConcept(concept));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TechnicalConcept> updateConcept(@PathVariable Long id, @RequestBody TechnicalConcept patch) {
        try {
            return ResponseEntity.ok(conceptService.updateConcept(id, patch));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConcept(@PathVariable Long id) {
        conceptService.deleteConcept(id);
        return ResponseEntity.noContent().build();
    }
}
