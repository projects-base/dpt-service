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
 * Everything the study client has learned about how one user is doing: daily
 * check-ins, solved problem slugs, passed challenges, spaced-repetition state
 * and bookmarks.
 *
 * Held as one JSON document per user rather than normalised tables. It is only
 * ever read and written whole by the one client that owns its shape, it is
 * small (a few hundred keys after fifteen weeks), and normalising it would mean
 * a schema migration every time the client adds a counter. The cost is that it
 * is not queryable from SQL — acceptable, because nothing queries it.
 *
 * {@code revision} is a last-writer-wins guard: a client sends the revision it
 * last saw, and a stale write is refused rather than silently clobbering a
 * session from another device.
 */
@Entity
@Table(name = "study_progress", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String dataJson;

    @Column(nullable = false)
    private long revision;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
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
