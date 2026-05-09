package com.cabinet.medical.controller;

import com.cabinet.medical.dto.request.ChatRequest;
import com.cabinet.medical.dto.response.ApiResponse;
import com.cabinet.medical.service.ChatAiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatAiController {

    private final ChatAiService chatAiService;

    @PostMapping
    public ResponseEntity<ApiResponse<String>> chat(
            @Valid @RequestBody ChatRequest request,
            Authentication authentication) {
        String response = chatAiService.chat(request.normalizedMessages(), authentication);
        return ResponseEntity.ok(ApiResponse.success(response, "Reponse IA", 200));
    }
}
