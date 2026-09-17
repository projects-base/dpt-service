package com.tracker.service.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** One interview question with its worked answer. */
@Entity
@Table(
    name = "prep_questions",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "question_key"}),
    indexes = @Index(name = "idx_prep_question_topic", columnList = "user_id, topic_key")
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrepQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "question_key", nullable = false)
    private String questionKey;

    @Column(name = "topic_key", nullable = false)
    private String topicKey;

    @Column(name = "category_key")
    private String categoryKey;

    @Column(name = "company_key")
    private String companyKey;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String prompt;

    /** Rendered HTML — the legacy bank ships tables and highlighted code. */
    @Column(columnDefinition = "TEXT")
    private String answerHtml;

    /** JSON array of {q, a}. Kept as text: it is read whole and never queried. */
    @Column(columnDefinition = "TEXT")
    private String followUpsJson;

    /** Comma separated. */
    private String tags;

    private String difficulty;

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
