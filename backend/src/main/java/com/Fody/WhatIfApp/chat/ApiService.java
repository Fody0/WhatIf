package com.Fody.WhatIfApp.chat;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class ApiService {
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // Constructor with dependency injection
    public ApiService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public ResponseEntity<String> postData(String message) {
        try {
            System.out.println("Starting generation with message: " + message);
            String apiUrl = "https://cohen-welsh-equation-accompanying.trycloudflare.com";
            apiUrl += "/generate";            // Create proper request body using DTO
            PromptRequest request = new PromptRequest(message);

            // Create headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Create entity with serialized JSON
            HttpEntity<PromptRequest> requestEntity = new HttpEntity<>(request, headers);

            return restTemplate.postForEntity(apiUrl, requestEntity, String.class);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error processing request");
        }
    }

    // DTO for request body
    private static class PromptRequest {
        private String prompt;

        public PromptRequest(String prompt) {
            this.prompt = prompt;
        }

        // Getter is required for serialization
        public String getPrompt() {
            return prompt;
        }
    }
}