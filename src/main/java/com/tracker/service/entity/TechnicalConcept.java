package com.tracker.service.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "technical_concepts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TechnicalConcept {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String resourceUrl;

    private String category; // e.g., System Design, Data Structures, Algorithms

    private String level; // e.g., Beginner, Intermediate, MAANG

    @Column(updatable = false)
    private LocalDateTime createdDate;

    @PrePersist
    protected void onCreate() {
        this.createdDate = LocalDateTime.now();
    }
}
