package com.Fody.WhatIfApp.message;

import com.Fody.WhatIfApp.chat.ChatEntity;
import com.Fody.WhatIfApp.user.User;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "_message")
public class MessageEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @Setter
    @JoinColumn(name = "chat_id")
    @JsonBackReference
    private ChatEntity chat;

    @Column(columnDefinition = "TEXT")
    private String message_question;

    @Column(columnDefinition = "TEXT")
    private String message_answer;
}
