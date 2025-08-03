package com.example.bankingservice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class UserValidationService {

    @Value("${client.service.url}")
    private String clientServiceBaseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    private String getUserEndpoint() {
        return clientServiceBaseUrl + "/user/me";
    }

    private String formatToken(String token) {
        return token != null && token.startsWith("Bearer ") ? token : "Bearer " + token;
    }

    public boolean validateUser(String token) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", formatToken(token));
            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                getUserEndpoint(),
                HttpMethod.GET,
                request,
                Map.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                Map user = response.getBody();
                return user != null && !(Boolean.TRUE.equals(user.get("blacklisted")));
            }

            System.out.println("Validation failed with status: " + response.getStatusCode());
        } catch (Exception e) {
            System.out.println("Validation exception: " + e.getMessage());
        }
        return false;
    }

    public Long getUserIdFromToken(String token) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", formatToken(token));
            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                getUserEndpoint(),
                HttpMethod.GET,
                request,
                Map.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                Map user = response.getBody();
                if (user != null && user.containsKey("id")) {
                    Object idObj = user.get("id");
                    return (idObj instanceof Integer) ? ((Integer) idObj).longValue() : (Long) idObj;
                }
            }

            System.out.println("Failed to extract user ID with status: " + response.getStatusCode());
        } catch (Exception e) {
            System.out.println("Error getting user ID: " + e.getMessage());
        }
        return null;
    }
}
