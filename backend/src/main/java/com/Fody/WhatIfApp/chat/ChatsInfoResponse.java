package com.Fody.WhatIfApp.chat;

import com.Fody.WhatIfApp.message.MessageEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatsInfoResponse {
    private Map<ChatEntity, MessageEntity[]> chats_with_messages;
}
