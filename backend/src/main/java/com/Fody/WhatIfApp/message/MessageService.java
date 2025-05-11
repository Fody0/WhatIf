package com.Fody.WhatIfApp.message;

import com.Fody.WhatIfApp.chat.ApiService;
import com.Fody.WhatIfApp.chat.ChatRepository;
import com.Fody.WhatIfApp.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MessageService {
    private final MessageRepository messageRepository;
    private final ChatRepository chatRepository;
    private final ApiService apiService;

    public String addMessage(String message, int chatId) {
        MessageEntity messageEntity = new MessageEntity();

        String message_answer = "Заглушка";

        var chat = chatRepository.findById(chatId).orElseThrow();

        messageEntity.setMessage_question(message);
        messageEntity.setMessage_answer(message_answer);

        messageEntity.setChat(chat);


//        var data = apiService.postData();

//        System.out.println(data);
        //Send a request to an LLM
        //messageEntity.setMessage_answer(answer);

        messageRepository.save(messageEntity);

        return message_answer;
    }
}
