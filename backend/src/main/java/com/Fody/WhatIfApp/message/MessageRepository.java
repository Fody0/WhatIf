package com.Fody.WhatIfApp.message;

import com.Fody.WhatIfApp.chat.ChatEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageRepository extends JpaRepository<MessageEntity, Integer> {

}
