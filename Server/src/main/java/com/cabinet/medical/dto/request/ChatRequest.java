package com.cabinet.medical.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class ChatRequest {

    @Valid
    private List<Message> messages = new ArrayList<>();

    /** Legacy single-message field — accepted for backward compatibility. */
    private String message;

    @AssertTrue(message = "Le message ou l'historique de conversation est obligatoire")
    public boolean hasConversationContent() {
        return (message != null && !message.isBlank())
                || (messages != null && messages.stream()
                        .anyMatch(m -> m.getContent() != null && !m.getContent().isBlank()));
    }

    /**
     * Returns the messages list if present, otherwise wraps the single
     * {@link #message} field in a user-role message.
     */
    public List<Message> normalizedMessages() {
        if (messages != null && !messages.isEmpty()) {
            return messages;
        }
        Message userMessage = new Message();
        userMessage.setRole("user");
        userMessage.setContent(message);
        return List.of(userMessage);
    }

    @Data
    public static class Message {
        private String role;
        private String content;
    }
}
