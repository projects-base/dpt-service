package com.tracker.service.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Validates a raw Google ID token against Google's public keys.
 *
 * Spring's JwtDecoders.fromOidcIssuerLocation("https://accounts.google.com")
 * automatically fetches Google's JWKS endpoint and checks:
 *   - Signature validity
 *   - Token expiry (exp)
 *   - Issuer (iss == https://accounts.google.com)
 *
 * We additionally validate the audience (aud) claim to ensure the token
 * was issued specifically for THIS application's client ID.
 */
@Component
public class GoogleTokenValidator {

    private final JwtDecoder jwtDecoder;
    private final String googleClientId;

    public GoogleTokenValidator(
            @Value("${app.google.client-id}") String googleClientId
    ) {
        this.googleClientId = googleClientId;

        // Build a decoder locked to Google's OIDC issuer
        NimbusJwtDecoder decoder = (NimbusJwtDecoder)
                JwtDecoders.fromOidcIssuerLocation("https://accounts.google.com");

        // Add audience validator — ensures the token was meant for our app
        OAuth2TokenValidator<Jwt> audienceValidator = token -> {
            List<String> audiences = token.getAudience();
            if (audiences != null && audiences.contains(googleClientId)) {
                return OAuth2TokenValidatorResult.success();
            }
            return OAuth2TokenValidatorResult.failure(
                    new OAuth2Error("invalid_token",
                            "Token audience does not match client ID", null)
            );
        };

        OAuth2TokenValidator<Jwt> defaultValidators =
                JwtValidators.createDefaultWithIssuer("https://accounts.google.com");

        decoder.setJwtValidator(
                new DelegatingOAuth2TokenValidator<>(defaultValidators, audienceValidator)
        );

        this.jwtDecoder = decoder;
    }

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
