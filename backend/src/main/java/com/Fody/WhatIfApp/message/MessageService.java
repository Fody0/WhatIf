package com.Fody.WhatIfApp.message;

import com.Fody.WhatIfApp.chat.ChatRepository;
import com.Fody.WhatIfApp.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MessageService {
    private final MessageRepository messageRepository;
    private final ChatRepository chatRepository;

    public void addMessage(String message, int chatId) {
        MessageEntity messageEntity = new MessageEntity();

        var chat = chatRepository.findById(chatId).orElseThrow();

        messageEntity.setMessage_question(message);

        messageEntity.setChat(chat);
        //Send a request to an LLM
        //messageEntity.setMessage_answer(answer);

        messageRepository.save(messageEntity);
    }
}
