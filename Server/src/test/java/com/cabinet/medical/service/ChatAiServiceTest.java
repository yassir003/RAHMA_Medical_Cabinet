package com.cabinet.medical.service;

import com.cabinet.medical.dto.request.ChatRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class ChatAiServiceTest {

    @Mock
    private MedecinService medecinService;
    @Mock
    private RendezVousService rendezVousService;
    @Mock
    private PatientService patientService;
    @Mock
    private ConsultationService consultationService;
    @Mock
    private AuthService authService;

    @Test
    void shouldReturnConfigurationMessageWhenApiKeyIsMissing() {
        ChatAiService chatAiService = new ChatAiService(
            new ObjectMapper(), medecinService, rendezVousService, patientService, consultationService, authService);
        ReflectionTestUtils.setField(chatAiService, "apiKey", "");

        ChatRequest.Message message = new ChatRequest.Message();
        message.setRole("user");
        message.setContent("Bonjour");

        String response = chatAiService.chat(List.of(message), null);

        assertThat(response).contains("n'est pas configuré");
    }

    @Test
    void shouldReturnFallbackMessage() {
        ChatAiService chatAiService = new ChatAiService(
            new ObjectMapper(), medecinService, rendezVousService, patientService, consultationService, authService);

        String response = chatAiService.aiFallback(List.of(), null, new RuntimeException("boom"));

        assertThat(response).contains("temporairement indisponible");
    }
}
