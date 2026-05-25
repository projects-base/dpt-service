package com.tracker.service.repository;

import com.tracker.service.entity.PrepNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrepNoteRepository extends JpaRepository<PrepNote, Long> {
    List<PrepNote> findByIsPublicTrue();
    List<PrepNote> findByAuthorId(Long authorId);
}
