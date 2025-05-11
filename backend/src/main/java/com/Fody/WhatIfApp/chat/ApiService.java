package com.Fody.WhatIfApp.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class ApiService {

    private final RestTemplate restTemplate;

    public ResponseEntity<String> postData() {
        String apiUrl = "https://events-opportunity-puppy-maritime.trycloudflare.com";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String requestBody = "{\"prompt\": Почему СССР распался?}";

        HttpEntity<String> requestEntity = new HttpEntity<>(requestBody, headers);
        return restTemplate.postForEntity(apiUrl, requestEntity, String.class);
    }
}