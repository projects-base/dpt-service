package com.tracker.service.config;

import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;

/**
 * Validates a raw Google ID token against Google's public keys.
 *
 * Delegates to the application's single {@link JwtDecoder} bean (see
 * {@link SecurityConfig#jwtDecoder()}), which checks:
 *   - Signature validity, against Google's JWKS
 *   - Token expiry (exp)
 *   - Issuer (iss == https://accounts.google.com)
 *   - Audience (aud == this application's client ID)
 *
 * Sharing that bean means one JWKS cache instead of two, and one place where
 * the validation rules can drift.
 */
@Component
@RequiredArgsConstructor
public class GoogleTokenValidator {

    private final JwtDecoder jwtDecoder;

    /**
     * Validates the Google ID token string and returns the decoded Jwt.
     *
     * @param credential the raw Google ID token (from chrome.identity or Google One Tap)
     * @return decoded and verified Jwt with all claims
     * @throws JwtException if the token is invalid, expired, or not from Google
     */
    public Jwt validate(String credential) {
        return jwtDecoder.decode(credential);
    }
}
