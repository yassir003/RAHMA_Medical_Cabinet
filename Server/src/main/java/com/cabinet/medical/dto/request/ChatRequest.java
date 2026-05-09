package com.cabinet.medical.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import lombok.Data;

@Data
public class ChatRequest {
    @NotBlank
    private String message;
}
