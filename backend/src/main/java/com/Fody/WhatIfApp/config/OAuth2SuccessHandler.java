//package com.Fody.WhatIfApp.config;
//
//import com.Fody.WhatIfApp.auth.AuthenticationResponse;
//import com.Fody.WhatIfApp.user.Role;
//import com.Fody.WhatIfApp.user.User;
//import com.Fody.WhatIfApp.user.UserRepository;
//import com.fasterxml.jackson.databind.ObjectMapper;
//import jakarta.servlet.http.HttpServletRequest;
//import jakarta.servlet.http.HttpServletResponse;
//import lombok.RequiredArgsConstructor;
//import org.springframework.security.core.Authentication;
//import org.springframework.security.crypto.password.PasswordEncoder;
//import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
//import org.springframework.security.oauth2.core.user.OAuth2User;
//import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
//import org.springframework.stereotype.Component;
//
//import java.io.IOException;
//import java.util.Optional;
//
//import java.util.UUID;
//
//@Component
//@RequiredArgsConstructor
//public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {
//
//    private final UserRepository userRepository;
//    private final JwtService jwtService;
//    private final PasswordEncoder passwordEncoder;
//
//    @Override
//    public void onAuthenticationSuccess(
//            HttpServletRequest request,
//            HttpServletResponse response,
//            Authentication authentication
//    ) throws IOException {
//        boolean isApiRequest = request.getHeader("Accept") != null
//                && request.getHeader("Accept").contains("application/json");
//
//        System.out.println("Is api request" + isApiRequest);
//
//        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
//        String provider = oauthToken.getAuthorizedClientRegistrationId();
//        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();
//
//        String email = oauthUser.getAttribute("email");
//        String name = oauthUser.getAttribute("name");
//        String providerId = oauthUser.getName();
//
//        Optional<User> existingUser = userRepository.findByEmail(email);
//        User user;
//
//        if (existingUser.isEmpty()) {
//            user = User.builder()
//                    .email(email)
//                    .name(name)
//                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
//                    .role(Role.User)
//                    .provider(provider)
//                    .providerId(providerId)
//                    .middle_name("")
//                    .build();
//            userRepository.save(user);
//        } else {
//            user = existingUser.get();
//        }
//
//        String jwtToken = jwtService.generateToken(user);
//
//        System.out.println("JWT Token: " + jwtToken);
//
//        if (isApiRequest) {
//            response.setContentType("application/json");
//            new ObjectMapper().writeValue(
//                    response.getWriter(),
//                    AuthenticationResponse.builder()
//                            .token(jwtToken)
//                            .email(user.getEmail())
//                            .name(user.getName())
//                            .surname(user.getSurname())
//                            .middle_name(user.getMiddle_name())
//                            .build()
//            );
//        } else {
//            response.sendRedirect("http://localhost:3000/oauth2/redirect?token=" + jwtToken);
//        }
//
//    }
//}