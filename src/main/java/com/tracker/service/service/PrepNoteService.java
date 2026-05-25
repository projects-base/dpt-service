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
}
