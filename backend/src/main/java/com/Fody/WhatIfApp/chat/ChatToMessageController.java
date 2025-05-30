package com.Fody.WhatIfApp.chat;

import com.Fody.WhatIfApp.config.JwtService;
import com.Fody.WhatIfApp.message.MessageRequest;
import com.Fody.WhatIfApp.message.MessageService;
import com.fasterxml.jackson.core.JsonProcessingException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/v1/chats")
@RequiredArgsConstructor
public class ChatToMessageController {
    private final ChatService chatService;
    private final MessageService messageService;
    private final JwtService jwtService;

    @PostMapping("/new_chat")
    public NewChatResponse addNewChat(HttpServletRequest httpRequest){
        System.out.println("I am in newChat endpoint");
        final String authHeader = httpRequest.getHeader("Authorization");
        final String jwtToken;
        final String userEmail;
        jwtToken = authHeader.substring(7);
        userEmail = jwtService.extractUsername(jwtToken);
        return chatService.newChat(userEmail);
    }

    @PostMapping("/new_message")
    public NewMessageResponse newMessage(@RequestBody MessageRequest messageRequest) throws JsonProcessingException {
        System.out.println("Message to respond: " + messageRequest.getMessage());
        return messageService.addMessage(messageRequest.getMessage(), messageRequest.getChat_id());
    }

    @PostMapping("/all_chats")
    public ChatsInfoResponse getAllChats(HttpServletRequest httpRequest){
        final String authHeader = httpRequest.getHeader("Authorization");
        final String jwtToken;
        final String userEmail;
        jwtToken = authHeader.substring(7);
        userEmail = jwtService.extractUsername(jwtToken);

        return chatService.getAllChats(userEmail);
    }
}
