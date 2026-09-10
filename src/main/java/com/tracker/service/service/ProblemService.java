package com.tracker.service.service;

import com.tracker.service.dto.ProblemRequest;
import com.tracker.service.entity.Problem;
import com.tracker.service.entity.User;
import com.tracker.service.exception.ForbiddenException;
import com.tracker.service.exception.NotFoundException;
import com.tracker.service.repository.ProblemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProblemService {

    private final ProblemRepository problemRepository;

    /** Persists a fully-built entity. Callers must have already set the owner. */
    public Problem saveProblem(Problem problem) {
        if (problem.getSolvedAt() == null) {
            problem.setSolvedAt(LocalDateTime.now());
        }
        problem.setDifficulty(normalizeDifficulty(problem.getDifficulty()));
        return problemRepository.save(problem);
    }

    /** Creates a new problem owned by {@code owner} from client-supplied fields. */
    public Problem create(ProblemRequest req, User owner) {
        Problem problem = Problem.builder()
                .title(req.title())
                .url(blankToNull(req.url()))
                .difficulty(normalizeDifficulty(req.difficulty()))
                .notes(blankToNull(req.notes()))
                .question(blankToNull(req.question()))
                .code(blankToNull(req.code()))
                .tags(blankToNull(req.tags()))
                .solvedAt(req.solvedAt() != null ? req.solvedAt() : LocalDateTime.now())
                .user(owner)
                .build();
        return problemRepository.save(problem);
    }

    public List<Problem> getUserProblems(Long userId) {
        return problemRepository.findByUserIdOrderBySolvedAtDesc(userId);
    }

    /** Loads a problem and asserts {@code requester} owns it. */
    public Problem getOwned(Long id, User requester) {
        Problem problem = problemRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Problem not found: " + id));
        if (!problem.getUser().getId().equals(requester.getId())) {
            throw new ForbiddenException("You may only access your own problems");
        }
        return problem;
    }

    public Problem update(Long id, ProblemRequest patch, User requester) {
        Problem existing = getOwned(id, requester);
        if (patch.title()      != null) existing.setTitle(patch.title());
        if (patch.url()        != null) existing.setUrl(blankToNull(patch.url()));
        if (patch.difficulty() != null) existing.setDifficulty(normalizeDifficulty(patch.difficulty()));
        if (patch.notes()      != null) existing.setNotes(patch.notes());
        if (patch.question()   != null) existing.setQuestion(patch.question());
        if (patch.code()       != null) existing.setCode(patch.code());
        if (patch.tags()       != null) existing.setTags(patch.tags());
        if (patch.solvedAt()   != null) existing.setSolvedAt(patch.solvedAt());
        return problemRepository.save(existing);
    }

    public void delete(Long id, User requester) {
        problemRepository.delete(getOwned(id, requester));
    }

    /**
     * Coerces whatever the clients send into one of EASY/MEDIUM/HARD.
     *
     * The extension turns every empty field into the literal string "N/A", which
     * used to land in the difficulty column and made those problems invisible to
     * the analytics breakdown. Anything unrecognised falls back to MEDIUM.
     */
    static String normalizeDifficulty(String raw) {
        if (raw == null) return "MEDIUM";
        String upper = raw.trim().toUpperCase();
        return switch (upper) {
            case "EASY", "MEDIUM", "HARD" -> upper;
            default -> "MEDIUM";
        };
    }

    private static String blankToNull(String s) {
        if (s == null) return null;
        String trimmed = s.trim();
        // The extension substitutes "N/A" for every field the user left empty.
        if (trimmed.isEmpty() || "N/A".equalsIgnoreCase(trimmed)) return null;
        return s;
    }
}
