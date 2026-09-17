package com.tracker.service.controller;

import com.tracker.service.config.CurrentUser;
import com.tracker.service.dto.PrepDtos.*;
import com.tracker.service.entity.User;
import com.tracker.service.service.PrepService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * The signed-in user's interview preparation bank and campaign.
 *
 * Every route resolves the owner from the token — there is no userId in any
 * path, so one user's material is never addressable by another.
 */
@RestController
@RequestMapping("/api/prep")
@RequiredArgsConstructor
public class PrepController {

    private final PrepService prepService;
    private final CurrentUser currentUser;

    /**
     * Replace the whole bank from the generator.
     *
     * Deliberately a replace: the extractor that produces this payload is the
     * source of truth, so material deleted upstream must disappear here too.
     */
    @PostMapping("/import")
    public ResponseEntity<ImportResult> importBank(@AuthenticationPrincipal Jwt jwt,
                                                   @Valid @RequestBody ImportRequest req) {
        User me = currentUser.require(jwt);
        return ResponseEntity.ok(prepService.importBank(me, req));
    }

    /**
     * Navigation and prose, with questions as stubs.
     *
     * Answer bodies are excluded — the full bank is roughly a megabyte of HTML
     * and the client renders one topic at a time.
     */
    @GetMapping("/bank")
    public ResponseEntity<BankView> getBank(@AuthenticationPrincipal Jwt jwt,
                                            @RequestParam(required = false) String planKey) {
        User me = currentUser.require(jwt);
        return ResponseEntity.ok(prepService.getBank(me, planKey));
    }

    /** Full questions, answers included, for one topic. */
    @GetMapping("/questions/{topicKey}")
    public ResponseEntity<List<QuestionDto>> getQuestions(@AuthenticationPrincipal Jwt jwt,
                                                          @PathVariable String topicKey) {
        User me = currentUser.require(jwt);
        return ResponseEntity.ok(prepService.getQuestions(me, topicKey));
    }

    /** Search prompts and answers. Returns whole questions so results are readable inline. */
    @GetMapping("/search")
    public ResponseEntity<List<QuestionDto>> search(@AuthenticationPrincipal Jwt jwt,
                                                    @RequestParam String q,
                                                    @RequestParam(defaultValue = "60") int limit) {
        User me = currentUser.require(jwt);
        return ResponseEntity.ok(prepService.search(me, q, limit));
    }

    @GetMapping("/plan/{planKey}")
    public ResponseEntity<PlanDto> getPlan(@AuthenticationPrincipal Jwt jwt,
                                           @PathVariable String planKey) {
        User me = currentUser.require(jwt);
        return ResponseEntity.ok(prepService.requirePlan(me, planKey));
    }

    /* ---------------- progress ---------------- */

    @GetMapping("/progress")
    public ResponseEntity<ProgressView> getProgress(@AuthenticationPrincipal Jwt jwt) {
        User me = currentUser.require(jwt);
        return ResponseEntity.ok(prepService.getProgress(me));
    }

    /**
     * Save progress.
     *
     * Send the revision last read; a stale one is refused with 409 so a second
     * device cannot silently overwrite a session it never saw. Omit it only for
     * a deliberate force-overwrite.
     */
    @PutMapping("/progress")
    public ResponseEntity<ProgressView> saveProgress(@AuthenticationPrincipal Jwt jwt,
                                                     @RequestBody ProgressRequest req) {
        User me = currentUser.require(jwt);
        return ResponseEntity.ok(prepService.saveProgress(me, req));
    }
}
