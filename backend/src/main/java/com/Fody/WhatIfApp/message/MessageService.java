package com.Fody.WhatIfApp.message;

import com.Fody.WhatIfApp.chat.ApiService;
import com.Fody.WhatIfApp.chat.ChatRepository;
import com.Fody.WhatIfApp.chat.NewMessageResponse;
import com.Fody.WhatIfApp.user.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MessageService {
    private final MessageRepository messageRepository;
    private final ChatRepository chatRepository;
    private final ApiService apiService;

    public NewMessageResponse addMessage(String message, int chatId) throws JsonProcessingException {
        MessageEntity messageEntity = new MessageEntity();

        String message_answer = "Заглушка";

        NewMessageResponse message_response = new NewMessageResponse();

        var chat = chatRepository.findById(chatId).orElseThrow();

        message_response.setMessage_answer(message_answer);

        messageEntity.setMessage_question(message);
//        messageEntity.setMessage_answer(message_answer);

        messageEntity.setChat(chat);

/// Block to comment
//        ResponseEntity<String> data = apiService.postData(message);
//
//        ObjectMapper mapper = new ObjectMapper();
//        JsonNode root = mapper.readTree(data.getBody());
//        var response = root.path("response").asText();
//
//
//        System.out.println(response);
//
//        //Send a request to an LLM
//        messageEntity.setMessage_answer(response);
//        message_response.setMessage_answer(response);
/// end

        messageRepository.save(messageEntity);

        return message_response;
    }
}
