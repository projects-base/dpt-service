package com.tracker.service.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tracker.service.dto.GeminiAnalyzeRequest;
import com.tracker.service.dto.GeminiAnalyzeResponse;
import com.tracker.service.dto.GeminiChatRequest;
import com.tracker.service.dto.GeminiChatResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiService {

    private static final String GEMINI_ENDPOINT =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    @Value("${app.gemini.api-key}")
    private String globalApiKey;

    private final UserService userService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * The user's own key if they set one, otherwise the server-wide fallback.
     *
     * Throws rather than calling Gemini with an empty key: the API then fails
     * with an opaque 400 that surfaced as a bare "API Error:" with nothing
     * after it, which told the user nothing about what to fix.
     */
    private String getEffectiveApiKey(String userEmail) {
        String key = globalApiKey;
        if (userEmail != null) {
            key = userService.findByEmail(userEmail)
                    .map(u -> (u.getGoogleApiKey() != null && !u.getGoogleApiKey().isBlank())
                            ? u.getGoogleApiKey() : globalApiKey)
                    .orElse(globalApiKey);
        }
        if (key == null || key.isBlank()) {
            throw new GeminiConfigurationException(
                    "No Gemini API key configured. Add one under Settings → Google API Key (Gemini), "
                    + "or set GEMINI_API_KEY on the server.");
        }
        return key;
    }

    /** No key available — the caller can fix this, so it maps to 400. */
    public static class GeminiConfigurationException extends RuntimeException {
        public GeminiConfigurationException(String message) { super(message); }
    }

    /** Gemini itself refused or was unreachable — maps to 502. */
    public static class GeminiUpstreamException extends RuntimeException {
        public GeminiUpstreamException(String message) { super(message); }
    }

    public GeminiAnalyzeResponse analyzeCode(GeminiAnalyzeRequest request, String email) {
        String problemContext = "\"" + request.getTitle() + "\"";
        if (request.getUrl() != null && !request.getUrl().isEmpty()) {
            problemContext += " (Problem Link: " + request.getUrl() + ")";
        }

        String prompt = "You are an expert coding interviewer. Review the following solution for the problem " + problemContext + ".\n\n" +
                "Source Code:\n" +
                "```\n" +
                request.getCode() + "\n" +
                "```\n\n" +
                "Evaluate it and provide the results strictly as a JSON object with exactly the following keys:\n" +
                "- \"difficulty\": string (\"Easy\", \"Medium\", or \"Hard\")\n" +
                "- \"analysis\": string (Extremely crisp time/space complexity. Max 10 words.)\n" +
                "- \"intuition\": number (1-10)\n" +
                "- \"implementation\": number (1-10)\n" +
                "- \"readability\": number (1-10)\n" +
                "- \"cleanCode\": number (1-10)\n" +
                "- \"suggestions\": string (1-3 crisp bullet points. Plain text.)\n\n" +
                "Return ONLY valid JSON. No markdown wrappers.";

        String responseText = callGeminiApi(prompt, 0.1, getEffectiveApiKey(email));

        try {
            // Extract JSON from potential markdown wrappers
            Matcher matcher = Pattern.compile("\\{[\\s\\S]*\\}").matcher(responseText);
            if (matcher.find()) {
                responseText = matcher.group(0);
            }
            return objectMapper.readValue(responseText, GeminiAnalyzeResponse.class);
        } catch (Exception e) {
            log.error("Failed to parse Gemini analyze response: {}", e.getClass().getSimpleName());
            throw new GeminiUpstreamException(
                    "Gemini returned a response that could not be read. Please try again.");
        }
    }

    public GeminiChatResponse chat(GeminiChatRequest request, String email) {
        String responseText = callGeminiApi(request.getMessage(), 0.7, getEffectiveApiKey(email));
        return new GeminiChatResponse(responseText);
    }

    private String callGeminiApi(String promptText, double temperature, String usedApiKey) {
        // The key travels in a header, never the query string. As a URL
        // parameter it ended up inside RestTemplate's exception messages, and
        // log.error(..., e) then wrote users' API keys into the server log.
        String endpoint = GEMINI_ENDPOINT;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", usedApiKey);

        Map<String, Object> part = new HashMap<>();
        part.put("text", promptText);

        Map<String, Object> content = new HashMap<>();
        content.put("parts", List.of(part));

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", temperature);

        Map<String, Object> body = new HashMap<>();
        body.put("contents", List.of(content));
        body.put("generationConfig", generationConfig);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            String responseStr = restTemplate.postForObject(endpoint, entity, String.class);
            JsonNode root = objectMapper.readTree(responseStr);
            JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
            return textNode.asText();
        } catch (HttpStatusCodeException e) {
            // Gemini answered, but with an error. Report enough to act on
            // without echoing a body that may quote the request.
            int code = e.getStatusCode().value();
            log.error("Gemini API returned {}", code);
            String hint = switch (code) {
                case 400 -> "Gemini rejected the request — the API key may be malformed.";
                case 401, 403 -> "Gemini rejected the API key. Check it is valid and that the "
                        + "Generative Language API is enabled for its project.";
                case 429 -> "Gemini rate limit or quota exceeded. Try again shortly.";
                default -> "Gemini returned HTTP " + code + ".";
            };
            throw new GeminiUpstreamException(hint);
        } catch (Exception e) {
            // Deliberately not logging the exception object: for a URL-bearing
            // client error its message can carry request details.
            log.error("Error calling Gemini API: {}", e.getClass().getSimpleName());
            throw new GeminiUpstreamException("Could not reach the Gemini API. Please try again.");
        }
    }
}
