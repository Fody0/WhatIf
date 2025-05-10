package com.Fody.WhatIfApp.message;

import com.Fody.WhatIfApp.chat.ChatEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<MessageEntity, Integer> {

    List<MessageEntity> findAllByChat(ChatEntity chat);
}
