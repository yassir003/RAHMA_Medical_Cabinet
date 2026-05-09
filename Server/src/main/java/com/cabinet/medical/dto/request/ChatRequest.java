package com.cabinet.medical.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class ChatRequest {

    @NotNull
    @NotEmpty
    @Valid
    private List<ChatMessageDto> messages;

    @Data
    public static class ChatMessageDto {
        /** "user" or "assistant" */
        private String role;
        private String content;
    }
}
