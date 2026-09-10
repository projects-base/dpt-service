package com.tracker.service.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** A parent → child link between two of the user's knowledge nodes. */
@Entity
@Table(
    name = "knowledge_edges",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "from_key", "to_key"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KnowledgeEdge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "from_key", nullable = false)
    private String fromKey;

    @Column(name = "to_key", nullable = false)
    private String toKey;

    // ON DELETE CASCADE at the database level: deleting a user must take their
    // knowledge map with them, otherwise the account-deletion the privacy
    // policy promises fails on a foreign-key violation.
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;
}
