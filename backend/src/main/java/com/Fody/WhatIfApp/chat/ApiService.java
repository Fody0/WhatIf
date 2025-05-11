package com.Fody.WhatIfApp.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class ApiService {

    private final RestTemplate restTemplate;

    public ResponseEntity<String> fetchData() {
        String apiUrl = "https://api.example.com/data";

        // Send GET request and await response
        ResponseEntity<String> response = restTemplate.getForEntity(apiUrl, String.class);

        // Process response
        if (response.getStatusCode().is2xxSuccessful()) {
            return response;
        } else {
            throw new RuntimeException("API request failed");
        }
    }
}