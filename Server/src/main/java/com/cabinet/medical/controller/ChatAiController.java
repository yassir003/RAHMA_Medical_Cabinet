package com.cabinet.medical.controller;

import com.cabinet.medical.dto.request.ChatRequest;
import com.cabinet.medical.dto.response.ApiResponse;
import com.cabinet.medical.service.ChatAiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatAiController {

    private final ChatAiService chatAiService;

    @PostMapping
    public ResponseEntity<ApiResponse<String>> chat(@Valid @RequestBody ChatRequest request) {
        String response = chatAiService.chat(request.getMessage());
        return ResponseEntity.ok(ApiResponse.success(response, "Réponse IA", 200));
    }
}
