package com.tracker.service.controller;

import com.tracker.service.config.CurrentUser;
import com.tracker.service.entity.TechnicalConcept;
import com.tracker.service.service.TechnicalConceptService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Shared reference material — the same catalogue for every user.
 *
 * Reads are open (see SecurityConfig: GET /api/concepts/** is permitted).
 * Writes are administrator-only; they used to be reachable by anyone at all.
 */
@RestController
@RequestMapping("/api/concepts")
@RequiredArgsConstructor
public class TechnicalConceptController {

    private final TechnicalConceptService conceptService;
    private final CurrentUser currentUser;

    @GetMapping
    public ResponseEntity<List<TechnicalConcept>> getAllConcepts() {
        return ResponseEntity.ok(conceptService.getAllConcepts());
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<TechnicalConcept>> getByCategory(@PathVariable String category) {
        return ResponseEntity.ok(conceptService.getConceptsByCategory(category));
    }

    @PostMapping
    public ResponseEntity<TechnicalConcept> addConcept(@AuthenticationPrincipal Jwt jwt,
                                                       @RequestBody TechnicalConcept concept) {
        currentUser.requireAdmin(jwt);
        concept.setId(null); // never let a client pick the primary key
        return ResponseEntity.ok(conceptService.saveConcept(concept));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TechnicalConcept> updateConcept(@AuthenticationPrincipal Jwt jwt,
                                                          @PathVariable Long id,
                                                          @RequestBody TechnicalConcept patch) {
        currentUser.requireAdmin(jwt);
        return ResponseEntity.ok(conceptService.updateConcept(id, patch));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConcept(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        currentUser.requireAdmin(jwt);
        conceptService.deleteConcept(id);
        return ResponseEntity.noContent().build();
    }
}
