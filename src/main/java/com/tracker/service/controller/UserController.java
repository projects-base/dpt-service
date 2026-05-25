package com.tracker.service.controller;

import com.tracker.service.dto.AuthResponse;
import com.tracker.service.entity.User;
import com.tracker.service.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import com.tracker.service.dto.UserSettingsRequest;
import com.tracker.service.dto.UserSettingsResponse;

/**
 * Endpoints for the authenticated user's own profile.
 * All routes here require a valid Google ID token as a Bearer token.
 * Spring Security's resource server validates it automatically before the method is called.
 */
@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * GET /api/users/me
     * Returns the profile of the currently authenticated user.
     *
     * The @AuthenticationPrincipal Jwt gives us the decoded token claims.
     * We extract the email and look up the user in our database.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getMe(@AuthenticationPrincipal Jwt jwt) {
        String email = jwt.getClaimAsString("email");

        return userService.findByEmail(email)
                .<ResponseEntity<?>>map(user -> ResponseEntity.ok(new AuthResponse(
                        user.getId(),
                        user.getEmail(),
                        user.getName(),
                        user.getPictureUrl(),
                        user.getRole(),
                        user.getSheetUrl(),
                        user.getFolderId(),
                        user.getGoogleApiKey(),
                        user.getOpenDoc(),
                        user.getOpenSheet()
                )))
                .orElse(ResponseEntity.status(404)
                        .body(new AuthController.ErrorResponse(
                                "User not found. Please sign in first via POST /auth/google."
                        )));
    }

    /**
     * PUT /api/users/me/settings
     * Updates the authenticated user's settings.
     */
    @PutMapping("/me/settings")
    public ResponseEntity<?> updateSettings(@AuthenticationPrincipal Jwt jwt, @RequestBody UserSettingsRequest req) {
        String email = jwt.getClaimAsString("email");
        return userService.findByEmail(email)
                .<ResponseEntity<?>>map(user -> {
                    user.setSheetUrl(req.getSheetUrl());
                    user.setFolderId(req.getFolderId());
                    user.setGoogleApiKey(req.getGoogleApiKey());
                    user.setOpenDoc(req.getOpenDoc());
                    user.setOpenSheet(req.getOpenSheet());
                    User saved = userService.saveUser(user);
                    return ResponseEntity.ok(new UserSettingsResponse(
                            saved.getSheetUrl(),
                            saved.getFolderId(),
                            saved.getGoogleApiKey(),
                            saved.getOpenDoc(),
                            saved.getOpenSheet()
                    ));
                })
                .orElse(ResponseEntity.status(404).body(new AuthController.ErrorResponse("User not found")));
    }
}
