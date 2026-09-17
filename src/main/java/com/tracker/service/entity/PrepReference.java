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
 * Prose reference material attached to a topic — the parts of the source kit
 * that are explanation rather than question and answer.
 *
 * Separate from {@link PrepNote}, which is something the user wrote themselves
 * and may publish. Mixing 110 extracted sections into that list would make
 * their own notes unfindable.
 */
@Entity
@Table(
    name = "prep_references",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "reference_key"}),
    indexes = @Index(name = "idx_prep_reference_topic", columnList = "user_id, topic_key")
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrepReference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reference_key", nullable = false)
    private String referenceKey;

    @Column(name = "topic_key", nullable = false)
    private String topicKey;

    @Column(name = "category_key")
    private String categoryKey;

    @Column(name = "company_key")
    private String companyKey;

    private String heading;

    /** Original heading depth, so the client can keep the hierarchy. */
    private Integer level;

    @Column(columnDefinition = "TEXT")
    private String html;

    private String source;

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
