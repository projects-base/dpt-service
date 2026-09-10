package com.tracker.service.service;

import com.tracker.service.dto.PrepNoteRequest;
import com.tracker.service.entity.PrepNote;
import com.tracker.service.entity.User;
import com.tracker.service.exception.ForbiddenException;
import com.tracker.service.exception.NotFoundException;
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

    public PrepNote create(PrepNoteRequest req, User author) {
        PrepNote note = PrepNote.builder()
                .title(req.title())
                .content(req.content())
                .isPublic(Boolean.TRUE.equals(req.isPublic()))
                .author(author)
                .build();
        return prepNoteRepository.save(note);
    }

    /** Loads a note and asserts {@code requester} wrote it. */
    public PrepNote getOwned(Long id, User requester) {
        PrepNote note = prepNoteRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("PrepNote not found: " + id));
        if (!note.getAuthor().getId().equals(requester.getId())) {
            throw new ForbiddenException("You may only access your own notes");
        }
        return note;
    }

    public PrepNote update(Long id, PrepNoteRequest patch, User requester) {
        PrepNote existing = getOwned(id, requester);
        if (patch.title()    != null) existing.setTitle(patch.title());
        if (patch.content()  != null) existing.setContent(patch.content());
        if (patch.isPublic() != null) existing.setPublic(patch.isPublic());
        return prepNoteRepository.save(existing);
    }

    public void delete(Long id, User requester) {
        prepNoteRepository.delete(getOwned(id, requester));
    }
}
