package com.tracker.service.controller;

import com.tracker.service.config.GoogleTokenValidator;
import com.tracker.service.dto.AuthResponse;
import com.tracker.service.dto.GoogleTokenRequest;
import com.tracker.service.entity.User;
import com.tracker.service.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.web.bind.annotation.*;

/**
 * Handles Google OAuth login.
 *
 * Flow:
 *  1. Chrome extension signs the user in via Google (chrome.identity or Google One Tap)
 *  2. Extension POSTs the raw Google ID token here
 *  3. We validate the token against Google's public keys
 *  4. Extract email, name, picture from claims
 *  5. Upsert user in our database
 *  6. Return the user profile — extension caches it locally
 *
 * All subsequent API calls use the same Google ID token as a Bearer token.
 * Spring Security's resource server validates those automatically.
 */
@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final GoogleTokenValidator googleTokenValidator;
    private final UserService userService;

    /**
     * POST /auth/google
     * Accepts a Google ID token, validates it, upserts the user, returns profile.
     */
    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@Valid @RequestBody GoogleTokenRequest request) {
        try {
            // Step 1: Validate the Google ID token
            Jwt jwt = googleTokenValidator.validate(request.credential());

            // Step 2: Extract claims
            String email     = jwt.getClaimAsString("email");
            String name      = jwt.getClaimAsString("name");
            String pictureUrl = jwt.getClaimAsString("picture");

            log.info("Google login attempt for email: {}", email);

            // Step 3: Upsert user in database
            User user = userService.getOrCreateUser(email, name, pictureUrl);

            log.info("User {} logged in successfully (id={})", email, user.getId());

            // Step 4: Return profile
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

        } catch (JwtException e) {
            log.warn("Invalid Google token: {}", e.getMessage());
            return ResponseEntity.status(401)
                    .body(new ErrorResponse("Invalid or expired Google token. Please sign in again."));
        } catch (Exception e) {
            log.error("Unexpected error during Google login", e);
            return ResponseEntity.status(500)
                    .body(new ErrorResponse("An unexpected error occurred. Please try again."));
        }
    }

    // Simple error wrapper record
    record ErrorResponse(String message) {}
}
