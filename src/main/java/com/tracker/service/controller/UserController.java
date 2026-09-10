package com.tracker.service.controller;

import com.tracker.service.config.CurrentUser;
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
    private final CurrentUser currentUser;

    /**
     * GET /api/users/me
     * Returns the profile of the currently authenticated user.
     *
     * The @AuthenticationPrincipal Jwt gives us the decoded token claims.
     * We extract the email and look up the user in our database.
     */
    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getMe(@AuthenticationPrincipal Jwt jwt) {
        User user = currentUser.require(jwt);
        return ResponseEntity.ok(new AuthResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getPictureUrl(),
                user.getRole(),
                user.getSheetUrl(),
                user.getFolderId(),
                user.getGoogleApiKey(),
                user.isOpenDoc(),
                user.isOpenSheet()
        ));
    }

    /**
     * PUT /api/users/me/settings
     * Updates the authenticated user's settings.
     */
    @PutMapping("/me/settings")
    public ResponseEntity<UserSettingsResponse> updateSettings(@AuthenticationPrincipal Jwt jwt,
                                                               @RequestBody UserSettingsRequest req) {
        User user = currentUser.require(jwt);

        // Every field is optional: a client that omits one keeps its current value.
        // The booleans arrive as nullable Boolean precisely so that an omitted
        // field is distinguishable from false — unboxing them blindly used to
        // throw NullPointerException and surface as a 500.
        if (req.getSheetUrl()     != null) user.setSheetUrl(req.getSheetUrl());
        if (req.getFolderId()     != null) user.setFolderId(req.getFolderId());
        if (req.getGoogleApiKey() != null) user.setGoogleApiKey(req.getGoogleApiKey());
        if (req.getOpenDoc()      != null) user.setOpenDoc(req.getOpenDoc());
        if (req.getOpenSheet()    != null) user.setOpenSheet(req.getOpenSheet());

        User saved = userService.saveUser(user);
        return ResponseEntity.ok(new UserSettingsResponse(
                saved.getSheetUrl(),
                saved.getFolderId(),
                saved.getGoogleApiKey(),
                saved.isOpenDoc(),
                saved.isOpenSheet()
        ));
    }
}
