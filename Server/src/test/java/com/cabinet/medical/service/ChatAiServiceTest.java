package com.cabinet.medical.service;

import com.cabinet.medical.dto.request.ChatRequest;
import com.cabinet.medical.dto.response.MedecinResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.domain.PageImpl;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
    @Mock
    private ObjectProvider<ChatClient.Builder> chatClientBuilderProvider;

    @Test
    void shouldReturnConfigurationMessageWhenApiKeyIsMissing() {
        ChatAiService chatAiService = new ChatAiService(
            chatClientBuilderProvider, medecinService, rendezVousService, patientService, consultationService, authService);
        ReflectionTestUtils.setField(chatAiService, "apiKey", "");

        ChatRequest.Message message = new ChatRequest.Message();
        message.setRole("user");
        message.setContent("Bonjour");

        String response = chatAiService.chat(List.of(message), null);

        assertThat(response).contains("n'est pas configure");
    }

    @Test
    void shouldReturnFallbackMessage() {
        ChatAiService chatAiService = new ChatAiService(
            chatClientBuilderProvider, medecinService, rendezVousService, patientService, consultationService, authService);

        String response = chatAiService.aiFallback(List.of(), null, new RuntimeException("boom"));

        assertThat(response).contains("temporairement indisponible");
    }

    @Test
    void shouldNotCreateAppointmentWhenDoctorNameDoesNotMatchExactly() {
        ChatAiService chatAiService = new ChatAiService(
            chatClientBuilderProvider, medecinService, rendezVousService, patientService, consultationService, authService);
        ChatAiService.MedicalCabinetTools tools = chatAiService.new MedicalCabinetTools(null);

        MedecinResponse otherDoctor = new MedecinResponse();
        otherDoctor.setId(99L);
        otherDoctor.setPrenom("Youness");
        otherDoctor.setNom("Benbakka");
        when(medecinService.getAll(any(), any())).thenReturn(new PageImpl<>(List.of(otherDoctor)));

        Object response = tools.createAppointment(
            "Dr. Sara Amrani",
            "2026-05-20T10:00:00",
            "Consultation",
            null,
            "patient@example.com");

        assertThat(response.toString()).contains("ne correspond pas exactement");
        verify(patientService, never()).getMe(any());
        verify(rendezVousService, never()).creerRendezVous(any());
    }
}
