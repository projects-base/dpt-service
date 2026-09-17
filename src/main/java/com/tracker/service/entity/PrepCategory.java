package com.tracker.service.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * A coarse prep area — DSA, Java, design, behavioural, company.
 *
 * Deliberately NOT {@link KnowledgeCategory}: that one drives the vis-network
 * mindmap on the dashboard, and dropping a whole interview syllabus into it
 * would bury the handful of pillars the map is meant to show. Same reasoning
 * for {@link PrepTopic} against KnowledgeNode. A projection into the map can be
 * added later as a deliberate choice rather than a side effect.
 */
@Entity
@Table(
    name = "prep_categories",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "category_key"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrepCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Stable client-facing id, e.g. "java". Unique per user. */
    @Column(name = "category_key", nullable = false)
    private String categoryKey;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String blurb;

    /** "knowledge" or "company". */
    private String kind;

    private Integer sortOrder;

    // ON DELETE CASCADE at the database level: deleting a user must take their
    // prep material with them, otherwise the account deletion the privacy
    // policy promises fails on a foreign-key violation.
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    @Column(updatable = false)
    private LocalDateTime createdDate;

    private LocalDateTime updatedDate;

    @PrePersist
    protected void onCreate() {
        this.createdDate = LocalDateTime.now();
        this.updatedDate = this.createdDate;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedDate = LocalDateTime.now();
    }
}
