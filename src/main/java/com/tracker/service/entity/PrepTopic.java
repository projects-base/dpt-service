package com.tracker.service.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** A section within a {@link PrepCategory}; questions and references hang off it. */
@Entity
@Table(
    name = "prep_topics",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "topic_key"}),
    indexes = @Index(name = "idx_prep_topic_category", columnList = "user_id, category_key")
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrepTopic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "topic_key", nullable = false)
    private String topicKey;

    @Column(name = "category_key", nullable = false)
    private String categoryKey;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String blurb;

    /** Set when this topic belongs to one employer rather than the general bank. */
    @Column(name = "company_key")
    private String companyKey;

    /** Which part of the legacy HTML kit it came from, for traceability. */
    private Integer part;

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
