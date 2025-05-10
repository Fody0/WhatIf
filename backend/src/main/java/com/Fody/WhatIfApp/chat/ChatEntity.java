package com.Fody.WhatIfApp.chat;

import com.Fody.WhatIfApp.user.User;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "_chat")
public class ChatEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @Setter
    @JoinColumn(name = "user_id")
    @JsonBackReference
    private User user;
}
