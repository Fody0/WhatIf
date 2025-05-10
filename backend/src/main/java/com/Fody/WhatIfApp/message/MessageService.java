package com.Fody.WhatIfApp.message;

import com.Fody.WhatIfApp.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MessageService {
    private final MessageRepository messageRepository;

    public void addMessage(String message, int chatId) {
        MessageEntity messageEntity = new MessageEntity();

        messageEntity.setChat_id(chatId);
        messageEntity.setMessage_question(message);

        //Send a request to an LLM

        messageRepository.save(messageEntity);
    }
}
