package com.tracker.service.controller;

import com.tracker.service.config.CurrentUser;
import com.tracker.service.dto.ProblemRequest;
import com.tracker.service.entity.Problem;
import com.tracker.service.entity.User;
import com.tracker.service.service.ProblemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/problems")
@RequiredArgsConstructor
public class ProblemController {

    private final ProblemService problemService;
    private final CurrentUser currentUser;

    /** The caller's own problems. */
    @GetMapping
    public ResponseEntity<List<Problem>> getMyProblems(@AuthenticationPrincipal Jwt jwt) {
        User me = currentUser.require(jwt);
        return ResponseEntity.ok(problemService.getUserProblems(me.getId()));
    }

    /**
     * Kept for the existing web dashboard, which calls /user/{userId}.
     * The id must be the caller's own (admins excepted).
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Problem>> getUserProblems(@AuthenticationPrincipal Jwt jwt,
                                                         @PathVariable Long userId) {
        currentUser.requireSelf(jwt, userId);
        return ResponseEntity.ok(problemService.getUserProblems(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Problem> getProblem(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        User me = currentUser.require(jwt);
        return ResponseEntity.ok(problemService.getOwned(id, me));
    }

    @PostMapping
    public ResponseEntity<Problem> addProblem(@AuthenticationPrincipal Jwt jwt,
                                              @Valid @RequestBody ProblemRequest req) {
        User me = currentUser.require(jwt);
        return ResponseEntity.ok(problemService.create(req, me));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Problem> updateProblem(@AuthenticationPrincipal Jwt jwt,
                                                 @PathVariable Long id,
                                                 @RequestBody ProblemRequest patch) {
        User me = currentUser.require(jwt);
        return ResponseEntity.ok(problemService.update(id, patch, me));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProblem(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        User me = currentUser.require(jwt);
        problemService.delete(id, me);
        return ResponseEntity.noContent().build();
    }
}
