package com.tracker.service.service;

import com.tracker.service.entity.Problem;
import com.tracker.service.repository.ProblemRepository;
import com.tracker.service.repository.UserRepository;
import com.tracker.service.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProblemService {

    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;

    public Problem saveProblem(Problem problem) {
        if (problem.getUser() != null && problem.getUser().getId() != null) {
            User userRef = userRepository.getReferenceById(problem.getUser().getId());
            problem.setUser(userRef);
        }
        if (problem.getSolvedAt() == null) {
            problem.setSolvedAt(LocalDateTime.now());
        }
        return problemRepository.save(problem);
    }

    public List<Problem> getUserProblems(Long userId) {
        return problemRepository.findByUserId(userId);
    }

    public void deleteProblem(Long id) {
        problemRepository.deleteById(id);
    }
    
    public Optional<Problem> getProblem(Long id) {
        return problemRepository.findById(id);
    }

    public Problem updateProblem(Long id, Problem patch) {
        return problemRepository.findById(id).map(existing -> {
            if (patch.getTitle()      != null) existing.setTitle(patch.getTitle());
            if (patch.getUrl()        != null) existing.setUrl(patch.getUrl());
            if (patch.getDifficulty() != null) existing.setDifficulty(patch.getDifficulty().toUpperCase());
            if (patch.getNotes()      != null) existing.setNotes(patch.getNotes());
            if (patch.getQuestion()   != null) existing.setQuestion(patch.getQuestion());
            if (patch.getCode()       != null) existing.setCode(patch.getCode());
            if (patch.getTags()       != null) existing.setTags(patch.getTags());
            if (patch.getSolvedAt()   != null) existing.setSolvedAt(patch.getSolvedAt());
            return problemRepository.save(existing);
        }).orElseThrow(() -> new RuntimeException("Problem not found: " + id));
    }
}
