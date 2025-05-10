package com.Fody.WhatIfApp.chat;

import com.Fody.WhatIfApp.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatRepository extends JpaRepository<ChatEntity, Integer> {

    List<ChatEntity> findAllByUser(User user);
}
