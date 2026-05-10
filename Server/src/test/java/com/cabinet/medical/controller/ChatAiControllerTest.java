package com.cabinet.medical.controller;

import com.cabinet.medical.config.SecurityConfig;
import com.cabinet.medical.dto.request.ChatRequest;
import com.cabinet.medical.exception.GlobalExceptionHandler;
import com.cabinet.medical.security.CustomAccessDeniedHandler;
import com.cabinet.medical.security.CustomAuthenticationEntryPoint;
import com.cabinet.medical.security.CustomUserDetailsService;
import com.cabinet.medical.security.JwtAuthenticationFilter;
import com.cabinet.medical.security.JwtTokenProvider;
import com.cabinet.medical.service.ChatAiService;
import com.cabinet.medical.support.TestCorsConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ChatAiController.class)
@Import({
    SecurityConfig.class,
    JwtAuthenticationFilter.class,
    CustomAccessDeniedHandler.class,
    CustomAuthenticationEntryPoint.class,
    GlobalExceptionHandler.class,
    TestCorsConfig.class
})
class ChatAiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ChatAiService chatAiService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    void shouldChatWithoutAuthentication() throws Exception {
        ChatRequest.Message message = new ChatRequest.Message();
        message.setRole("user");
        message.setContent("Bonjour");
        ChatRequest request = new ChatRequest();
        request.setMessages(List.of(message));
        when(chatAiService.chat(any(), any())).thenReturn("Bonjour, comment puis-je vous aider ?");

        mockMvc.perform(post("/api/v1/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").value("Bonjour, comment puis-je vous aider ?"));
    }

    @Test
    void shouldRejectChatWithoutMessageContent() throws Exception {
        ChatRequest request = new ChatRequest();

        mockMvc.perform(post("/api/v1/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("Validation échouée"));
    }
}
