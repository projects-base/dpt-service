package com.tracker.service.controller;

import com.tracker.service.config.CurrentUser;
import com.tracker.service.dto.KnowledgeDtos.*;
import com.tracker.service.entity.User;
import com.tracker.service.service.KnowledgeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * The signed-in user's knowledge map.
 *
 * Every route resolves the owner from the token — there is no userId in any
 * path, so one user's map is never addressable by another.
 */
@RestController
@RequestMapping("/api/knowledge")
@RequiredArgsConstructor
public class KnowledgeController {

    private final KnowledgeService knowledgeService;
    private final CurrentUser currentUser;

    /** The whole map. Seeds a starter map on first call. */
    @GetMapping
    public ResponseEntity<GraphView> getGraph(@AuthenticationPrincipal Jwt jwt) {
        User me = currentUser.require(jwt);
        return ResponseEntity.ok(knowledgeService.getGraph(me));
    }

    @PostMapping("/nodes")
    public ResponseEntity<NodeView> addNode(@AuthenticationPrincipal Jwt jwt,
                                            @Valid @RequestBody NodeRequest req) {
        User me = currentUser.require(jwt);
        return ResponseEntity.ok(knowledgeService.addNode(me, req));
    }

    @PatchMapping("/nodes/{nodeKey}")
    public ResponseEntity<NodeView> updateNode(@AuthenticationPrincipal Jwt jwt,
                                               @PathVariable String nodeKey,
                                               @Valid @RequestBody NodePatch patch) {
        User me = currentUser.require(jwt);
        return ResponseEntity.ok(knowledgeService.updateNode(me, nodeKey, patch));
    }

    @DeleteMapping("/nodes/{nodeKey}")
    public ResponseEntity<Void> deleteNode(@AuthenticationPrincipal Jwt jwt,
                                           @PathVariable String nodeKey) {
        User me = currentUser.require(jwt);
        knowledgeService.deleteNode(me, nodeKey);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/categories")
    public ResponseEntity<CategoryView> addCategory(@AuthenticationPrincipal Jwt jwt,
                                                    @Valid @RequestBody CategoryRequest req) {
        User me = currentUser.require(jwt);
        return ResponseEntity.ok(knowledgeService.addCategory(me, req));
    }

    @DeleteMapping("/categories/{categoryKey}")
    public ResponseEntity<Void> deleteCategory(@AuthenticationPrincipal Jwt jwt,
                                               @PathVariable String categoryKey) {
        User me = currentUser.require(jwt);
        knowledgeService.deleteCategory(me, categoryKey);
        return ResponseEntity.noContent().build();
    }

    /**
     * One-time adoption of a map that was living in a browser's localStorage.
     * Ignored (200 with imported=false) once the stored map has real content,
     * so a stale second device cannot clobber it.
     */
    @PostMapping("/import")
    public ResponseEntity<Map<String, Object>> importGraph(@AuthenticationPrincipal Jwt jwt,
                                                           @RequestBody ImportRequest req) {
        User me = currentUser.require(jwt);
        boolean imported = knowledgeService.importGraph(me, req);
        return ResponseEntity.ok(Map.of(
                "imported", imported,
                "graph", knowledgeService.getGraph(me)
        ));
    }
}
