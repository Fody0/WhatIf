package com.Fody.WhatIfApp.chat;

import com.Fody.WhatIfApp.message.MessageEntity;
import com.Fody.WhatIfApp.message.MessageRepository;
import com.Fody.WhatIfApp.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ChatService {
    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;

    public NewChatResponse newChat(String userEmail) {
        ChatEntity chatEntity = new ChatEntity();
        NewChatResponse newChatResponse = new NewChatResponse();



        var user = userRepository.findByEmail(userEmail).orElseThrow();

        chatEntity.setUser(user);

        chatRepository.save(chatEntity);

        newChatResponse.setChat_id(chatEntity.getId());

        return newChatResponse;
    }

    public ChatsInfoResponse getAllChats(String userEmail) {
        ChatsInfoResponse response = new ChatsInfoResponse();
        Map<ChatEntity, MessageEntity[]> chats_with_messages = new HashMap<>();

        var user = userRepository.findByEmail(userEmail).orElseThrow();
        var chats = chatRepository.findAllByUser(user);



        for (var chat: chats){
            var messages = messageRepository.findAllByChat(chat);

            chats_with_messages.put(chat, messages.toArray(new MessageEntity[0]));
        }

        response.setChats_with_messages(chats_with_messages);

        return response;
    }
}
