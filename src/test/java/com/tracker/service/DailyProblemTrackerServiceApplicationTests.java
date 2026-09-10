package com.tracker.service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest
class DailyProblemTrackerServiceApplicationTests {

	/**
	 * Without this the context builds a real NimbusJwtDecoder, which fetches
	 * Google's JWKS over the network — making the build fail wherever it is
	 * offline or Google is unreachable.
	 */
	@MockitoBean
	JwtDecoder jwtDecoder;

	@Test
	void contextLoads() {
	}

}
