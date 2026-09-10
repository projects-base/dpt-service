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
 * One node on the user's knowledge map: the root, a category pillar, or a saved
 * resource (a video, article or note they want to come back to).
 */
@Entity
@Table(
    name = "knowledge_nodes",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "node_key"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KnowledgeNode {

    /** The single hub every map hangs off. */
    public static final String KIND_ROOT = "ROOT";
    /** A category's branch node. */
    public static final String KIND_PILLAR = "PILLAR";
    /** Something the user saved to learn from. */
    public static final String KIND_RESOURCE = "RESOURCE";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Stable client-facing identifier, unique per user. Used as the vis.js node id. */
    @Column(name = "node_key", nullable = false)
    private String nodeKey;

    @Column(nullable = false)
    private String label;

    private String icon;

    @Column(length = 2048)
    private String url;

    /** categoryKey this node belongs to. Null for the root. */
    private String categoryKey;

    @Column(nullable = false)
    private String kind;

    @Column(columnDefinition = "TEXT")
    private String notes;

    // ON DELETE CASCADE at the database level: deleting a user must take their
    // knowledge map with them, otherwise the account-deletion the privacy
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
