package com.tracker.service.config;

import com.tracker.service.entity.User;
import com.tracker.service.exception.ForbiddenException;
import com.tracker.service.exception.NotFoundException;
import com.tracker.service.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

/**
 * Resolves the caller's own {@link User} row from a validated Google ID token.
 *
 * Every authenticated endpoint must go through this instead of trusting a
 * userId supplied in the path or request body — otherwise any signed-in user
 * can read and mutate another user's data.
 */
@Component
@RequiredArgsConstructor
public class CurrentUser {

    public static final String ROLE_ADMIN = "ROLE_ADMIN";

    private final UserService userService;

    /** The user the token belongs to. */
    public User require(Jwt jwt) {
        if (jwt == null) {
            throw new ForbiddenException("Authentication required");
        }
        String email = jwt.getClaimAsString("email");
        if (email == null || email.isBlank()) {
            throw new ForbiddenException("Token has no email claim");
        }
        return userService.findByEmail(email)
                .orElseThrow(() -> new NotFoundException(
                        "User not found. Please sign in first via POST /auth/google."));
    }

    /**
     * Resolves the caller and asserts they are {@code userId}.
     * Admins may act on behalf of anyone.
     */
    public User requireSelf(Jwt jwt, Long userId) {
        User me = require(jwt);
        if (!me.getId().equals(userId) && !isAdmin(me)) {
            throw new ForbiddenException("You may only access your own data");
        }
        return me;
    }

    /** Asserts the caller owns {@code ownerId}, or is an admin. */
    public User requireOwner(Jwt jwt, Long ownerId) {
        return requireSelf(jwt, ownerId);
    }

    public User requireAdmin(Jwt jwt) {
        User me = require(jwt);
        if (!isAdmin(me)) {
            throw new ForbiddenException("Administrator role required");
        }
        return me;
    }

    public boolean isAdmin(User user) {
        return ROLE_ADMIN.equals(user.getRole());
    }
}
