package com.tracker.service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

/** Request and response shapes for the knowledge map. */
public final class KnowledgeDtos {

    private KnowledgeDtos() {}

    // ── Responses ──────────────────────────────────────────────────────

    public record NodeView(
            String nodeKey,
            String label,
            String icon,
            String url,
            String categoryKey,
            String kind,
            String notes,
            LocalDateTime createdDate
    ) {}

    public record EdgeView(String from, String to) {}

    public record CategoryView(
            String categoryKey,
            String label,
            String icon,
            String pillarNodeKey,
            String colorBg,
            String colorBorder,
            String colorFont,
            boolean builtIn
    ) {}

    /** The whole map in one payload — what the dashboard loads on open. */
    public record GraphView(
            List<NodeView> nodes,
            List<EdgeView> edges,
            List<CategoryView> categories
    ) {}

    // ── Requests ───────────────────────────────────────────────────────

    /** Save a resource onto the map. */
    public record NodeRequest(
            @NotBlank(message = "label must not be blank")
            @Size(max = 255, message = "label must be at most 255 characters")
            String label,

            @Size(max = 2048, message = "url must be at most 2048 characters")
            String url,

            @NotBlank(message = "categoryKey must not be blank")
            String categoryKey,

            String notes
    ) {}

    /** Edit an existing node. Any null field is left alone. */
    public record NodePatch(
            @Size(max = 255, message = "label must be at most 255 characters")
            String label,
            @Size(max = 2048, message = "url must be at most 2048 characters")
            String url,
            String categoryKey,
            String notes
    ) {}

    /** Add a branch. The server creates its pillar node and links it to the root. */
    public record CategoryRequest(
            @NotBlank(message = "label must not be blank")
            @Size(max = 120, message = "label must be at most 120 characters")
            String label,
            String icon
    ) {}

    /**
     * One-time import of a map that was living in the browser's localStorage.
     * Only accepted while the user's stored map is still untouched.
     */
    public record ImportRequest(
            List<ImportNode> nodes,
            List<EdgeView> edges,
            List<CategoryView> categories
    ) {}

    public record ImportNode(
            String nodeKey,
            String label,
            String icon,
            String url,
            String categoryKey,
            String kind,
            String notes
    ) {}
}
