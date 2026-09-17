package com.tracker.service.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * One week of a dated preparation campaign.
 *
 * The plan itself is just its weeks plus a key, so there is no separate parent
 * row to keep in step — a campaign is created and replaced wholesale on import.
 */
@Entity
@Table(
    name = "prep_plan_weeks",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "plan_key", "week_key"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrepPlanWeek {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** e.g. "microsoft-15w". */
    @Column(name = "plan_key", nullable = false)
    private String planKey;

    /** e.g. "W7". */
    @Column(name = "week_key", nullable = false)
    private String weekKey;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String weekdays;

    @Column(columnDefinition = "TEXT")
    private String weekendWork;

    /** JSON array of [displayName, leetcodeSlug] pairs. */
    @Column(columnDefinition = "TEXT")
    private String problemsJson;

    @Column(columnDefinition = "TEXT")
    private String challenge;

    private String videoLabel;

    @Column(length = 512)
    private String videoQuery;

    @Column(columnDefinition = "TEXT")
    private String algomaster;

    @Column(columnDefinition = "TEXT")
    private String milestone;

    /** A deliberately reduced week, not a failed one. */
    private boolean light;

    private Integer sortOrder;

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
