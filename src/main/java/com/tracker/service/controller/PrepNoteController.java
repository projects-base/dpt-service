package com.tracker.service.controller;

import com.tracker.service.config.CurrentUser;
import com.tracker.service.dto.PrepNoteRequest;
import com.tracker.service.entity.PrepNote;
import com.tracker.service.entity.User;
import com.tracker.service.service.PrepNoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class PrepNoteController {

    private final PrepNoteService prepNoteService;
    private final CurrentUser currentUser;

    /** Notes their authors chose to share. Requires sign-in, but not ownership. */
    @GetMapping("/public")
    public ResponseEntity<List<PrepNote>> getPublicNotes() {
        return ResponseEntity.ok(prepNoteService.getPublicNotes());
    }

    @GetMapping
    public ResponseEntity<List<PrepNote>> getMyNotes(@AuthenticationPrincipal Jwt jwt) {
        User me = currentUser.require(jwt);
        return ResponseEntity.ok(prepNoteService.getUserNotes(me.getId()));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PrepNote>> getUserNotes(@AuthenticationPrincipal Jwt jwt,
                                                       @PathVariable Long userId) {
        currentUser.requireSelf(jwt, userId);
        return ResponseEntity.ok(prepNoteService.getUserNotes(userId));
    }

    @PostMapping
    public ResponseEntity<PrepNote> createNote(@AuthenticationPrincipal Jwt jwt,
                                               @Valid @RequestBody PrepNoteRequest req) {
        User me = currentUser.require(jwt);
        return ResponseEntity.ok(prepNoteService.create(req, me));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PrepNote> updateNote(@AuthenticationPrincipal Jwt jwt,
                                               @PathVariable Long id,
                                               @RequestBody PrepNoteRequest patch) {
        User me = currentUser.require(jwt);
        return ResponseEntity.ok(prepNoteService.update(id, patch, me));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        User me = currentUser.require(jwt);
        prepNoteService.delete(id, me);
        return ResponseEntity.noContent().build();
    }
}
