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
 * A branch of the user's knowledge map — "Deep Dive", "System Design", or one
 * they invented. Each category owns exactly one pillar node on the graph, and
 * lends its colours to every resource filed under it.
 */
@Entity
@Table(
    name = "knowledge_categories",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "category_key"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KnowledgeCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Stable client-facing identifier, unique per user (e.g. "system", "custom_1737..."). */
    @Column(name = "category_key", nullable = false)
    private String categoryKey;

    @Column(nullable = false)
    private String label;

    private String icon;

    /** nodeKey of this category's pillar node. */
    @Column(name = "pillar_node_key")
    private String pillarNodeKey;

    private String colorBg;
    private String colorBorder;
    private String colorFont;

    /** True for the four categories every new map starts with. */
    @Column(nullable = false)
    private boolean builtIn;

    // ON DELETE CASCADE at the database level: deleting a user must take their
    // knowledge map with them, otherwise the account-deletion the privacy
    // policy promises fails on a foreign-key violation.
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    @Column(updatable = false)
    private LocalDateTime createdDate;

    @PrePersist
    protected void onCreate() {
        this.createdDate = LocalDateTime.now();
    }
}
