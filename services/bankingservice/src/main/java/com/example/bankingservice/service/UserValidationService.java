package com.example.bankingservice.service;

import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class UserValidationService {

    private final String CLIENT_SERVICE_URL = "http://client-service:8081/api/user/me";

    private final RestTemplate restTemplate = new RestTemplate();

    public boolean validateUser(String token) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", token);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                CLIENT_SERVICE_URL,
                HttpMethod.GET,
                request,
                Map.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                Map user = response.getBody();
                return user != null && !(Boolean.TRUE.equals(user.get("blacklisted")));
            }

        } catch (Exception e) {
            System.out.println("Validation failed: " + e.getMessage());
        }
        return false;
    }

    // --- NEW METHOD ADDED BELOW THIS LINE ---

    /**
     * Calls the bankingserviceservice's /me endpoint to get user details and extracts the user ID.
     * This ID is then used by the Banking Service to fetch user-specific data like transactions.
     *
     * @param token The JWT token from the Authorization header.
     * @return The user's ID (Long) if successful and valid, otherwise null.
     */
    public Long getUserIdFromToken(String token) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", token);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                CLIENT_SERVICE_URL,
                HttpMethod.GET,
                request,
                Map.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                Map user = response.getBody();
                // Assuming your /me endpoint in the client service returns an "id" field
                if (user != null && user.containsKey("id")) {
                    Object idObj = user.get("id");
                    // Handle potential type mismatch (e.g., Integer from JSON mapped to Object, needing cast to Long)
                    if (idObj instanceof Integer) {
                        return ((Integer) idObj).longValue();
                    } else if (idObj instanceof Long) {
                        return (Long) idObj;
                    }
                }
            }

        } catch (Exception e) {
            System.out.println("Failed to get user ID from token: " + e.getMessage());
        }
        return null;
    }
}