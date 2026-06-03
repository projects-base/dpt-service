package com.tracker.service.service;

import com.tracker.service.entity.PrepNote;
import com.tracker.service.repository.PrepNoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PrepNoteService {

    private final PrepNoteRepository prepNoteRepository;

    public List<PrepNote> getPublicNotes() {
        return prepNoteRepository.findByIsPublicTrue();
    }

    public List<PrepNote> getUserNotes(Long userId) {
        return prepNoteRepository.findByAuthorId(userId);
    }

    public PrepNote saveNote(PrepNote note) {
        return prepNoteRepository.save(note);
    }

    public PrepNote updateNote(Long id, PrepNote patch) {
        return prepNoteRepository.findById(id).map(existing -> {
            if (patch.getTitle()   != null) existing.setTitle(patch.getTitle());
            if (patch.getContent() != null) existing.setContent(patch.getContent());
            existing.setPublic(patch.isPublic());
            return prepNoteRepository.save(existing);
        }).orElseThrow(() -> new RuntimeException("PrepNote not found: " + id));
    }

    public void deleteNote(Long id) {
        prepNoteRepository.deleteById(id);
    }
}
