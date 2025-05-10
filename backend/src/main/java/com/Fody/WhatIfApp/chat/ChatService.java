package com.Fody.WhatIfApp.chat;

import com.Fody.WhatIfApp.user.User;
import com.Fody.WhatIfApp.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChatService {
    private final ChatRepository chatRepository;
    private final UserRepository userRepository;

    public int newChat(String userEmail) {
        ChatEntity chatEntity = new ChatEntity();

        var user = userRepository.findByEmail(userEmail).orElseThrow();

        chatEntity.setUser(user);

        chatRepository.save(chatEntity);

        return chatEntity.getId();
    }
}
