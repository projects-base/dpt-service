package com.tracker.service.controller;

import com.tracker.service.entity.PrepNote;
import com.tracker.service.service.PrepNoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class PrepNoteController {

    private final PrepNoteService prepNoteService;

    @GetMapping("/public")
    public ResponseEntity<List<PrepNote>> getPublicNotes() {
        return ResponseEntity.ok(prepNoteService.getPublicNotes());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PrepNote>> getUserNotes(@PathVariable Long userId) {
        return ResponseEntity.ok(prepNoteService.getUserNotes(userId));
    }

    @PostMapping
    public ResponseEntity<PrepNote> createNote(@RequestBody PrepNote note) {
        return ResponseEntity.ok(prepNoteService.saveNote(note));
    }
}
