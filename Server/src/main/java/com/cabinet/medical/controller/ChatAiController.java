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

    /**
     * POST /api/v1/chat
     *
     * Accepts a conversation history (role/content pairs) and returns the
     * assistant's next reply.  The endpoint is publicly accessible so even
     * unauthenticated visitors can chat; tools that require authentication
     * check the SecurityContext internally and return a friendly message
     * when the caller is anonymous.
     *
     * If the caller is a logged-in PATIENT their JWT must be present in the
     * Authorization header so the JWT filter populates the SecurityContext —
     * this enables the appointment-creation and history-lookup tools.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<String>> chat(@Valid @RequestBody ChatRequest request) {
        String reply = chatAiService.chat(request.getMessages());
        return ResponseEntity.ok(ApiResponse.success(reply, "Réponse IA", 200));
    }
}
