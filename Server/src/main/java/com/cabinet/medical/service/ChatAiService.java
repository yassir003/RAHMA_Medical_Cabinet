package com.cabinet.medical.service;

import com.cabinet.medical.dto.request.ChatRequest;
import com.cabinet.medical.dto.request.RendezVousRequest;
import com.cabinet.medical.dto.response.ConsultationResponse;
import com.cabinet.medical.dto.response.MedecinResponse;
import com.cabinet.medical.dto.response.PatientResponse;
import com.cabinet.medical.dto.response.RendezVousResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatAiService {

    private final RestClient restClient;

    @Value("${spring.ai.openai.api-key:}")
    private String apiKey;

    @Value("${spring.ai.openai.chat.model:gpt-4o}")
    private String model;

    private static final String SYSTEM_PROMPT =
        "Tu es un assistant du cabinet médical. Tu réponds aux questions sur les médecins, " +
        "spécialités, horaires et fonctionnement du cabinet. " +
        "Tu ne fournis pas de diagnostics médicaux.";

    public ChatAiService() {
        this.restClient = RestClient.builder()
            .baseUrl("https://api.openai.com/v1")
            .build();
    }

    @CircuitBreaker(name = "aiService", fallbackMethod = "aiFallback")
    public String chat(String message) {
        if ("YOUR_OPENAI_API_KEY".equals(apiKey)) {
            return "L'assistant IA n'est pas configuré. Veuillez définir spring.ai.openai.api-key dans application.properties.";
        }

        Map<String, Object> requestBody = Map.of(
            "model", model,
            "messages", List.of(
                Map.of("role", "system", "content", SYSTEM_PROMPT),
                Map.of("role", "user", "content", message)
            )
        );

        Map<?, ?> response = restClient.post()
            .uri("/chat/completions")
            .header("Authorization", "Bearer " + apiKey)
            .contentType(MediaType.APPLICATION_JSON)
            .body(requestBody)
            .retrieve()
            .body(Map.class);

        if (response != null && response.containsKey("choices")) {
            List<?> choices = (List<?>) response.get("choices");
            if (!choices.isEmpty()) {
                Map<?, ?> choice = (Map<?, ?>) choices.get(0);
                Map<?, ?> msg = (Map<?, ?>) choice.get("message");
                return (String) msg.get("content");
            }
        }
        return "Aucune réponse reçue de l'assistant IA.";
    }

    public String aiFallback(String message, Exception ex) {
        log.warn("AI service unavailable: {}", ex.getMessage());
        return "L'assistant IA est temporairement indisponible.";
    }
}
