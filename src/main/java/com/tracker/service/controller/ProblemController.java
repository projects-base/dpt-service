package com.tracker.service.controller;

import com.tracker.service.entity.Problem;
import com.tracker.service.service.ProblemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/problems")
@RequiredArgsConstructor
public class ProblemController {

    private final ProblemService problemService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Problem>> getUserProblems(@PathVariable Long userId) {
        return ResponseEntity.ok(problemService.getUserProblems(userId));
    }

    @PostMapping
    public ResponseEntity<Problem> addProblem(@RequestBody Problem problem) {
        return ResponseEntity.ok(problemService.saveProblem(problem));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProblem(@PathVariable Long id) {
        problemService.deleteProblem(id);
        return ResponseEntity.noContent().build();
    }
}
