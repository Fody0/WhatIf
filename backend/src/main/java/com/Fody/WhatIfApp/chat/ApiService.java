package com.Fody.WhatIfApp.chat;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class ApiService {
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${api.base.url:https://default-api-url.com}")
    private String apiBaseUrl;

    public ResponseEntity<String> postData(String message) {
        try {
            System.out.println("Starting generation with message: " + message);

            System.out.println("URL to send request " + apiBaseUrl);

            String apiUrl = apiBaseUrl;
            apiUrl += "/generate";
            PromptRequest request = new PromptRequest(message);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

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