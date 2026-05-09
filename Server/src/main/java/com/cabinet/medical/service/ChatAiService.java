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
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatAiService {

    private static final ZoneId CABINET_ZONE = ZoneId.of("Africa/Casablanca");
    private static final int MAX_TOOL_ROUNDS = 3;

    private final MedecinService medecinService;
    private final RendezVousService rendezVousService;
    private final PatientService patientService;
    private final ConsultationService consultationService;
    private final ObjectMapper objectMapper;

    @Value("${spring.ai.openai.api-key:}")
    private String apiKey;

    @Value("${spring.ai.openai.chat.model:gpt-4o-mini}")
    private String model;

    private final RestClient restClient = RestClient.builder()
        .baseUrl("https://api.openai.com/v1")
        .build();

    @CircuitBreaker(name = "aiService", fallbackMethod = "aiFallback")
    public String chat(List<ChatRequest.Message> chatHistory, Authentication authentication) {
        if (apiKey == null || apiKey.isBlank() || "YOUR_OPENAI_API_KEY".equals(apiKey)) {
            return "L'assistant IA n'est pas configure. Veuillez definir la variable OPENAI_API_KEY.";
        }

        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", buildSystemPrompt()));
        messages.add(Map.of("role", "system", "content", buildAuthenticationContext(authentication)));

        for (ChatRequest.Message message : chatHistory) {
            if (message.getContent() == null || message.getContent().isBlank()) {
                continue;
            }
            String role = "assistant".equals(message.getRole()) ? "assistant" : "user";
            messages.add(Map.of("role", role, "content", message.getContent()));
        }

        for (int round = 0; round < MAX_TOOL_ROUNDS; round++) {
            Map<String, Object> assistantMessage = requestAssistantMessage(messages, true);
            List<Map<String, Object>> toolCalls = extractToolCalls(assistantMessage);

            if (toolCalls.isEmpty()) {
                Object content = assistantMessage.get("content");
                return content instanceof String answer && !answer.isBlank()
                    ? answer
                    : "Je n'ai pas pu generer une reponse pour le moment.";
            }

            messages.add(toAssistantToolCallMessage(assistantMessage, toolCalls));
            for (Map<String, Object> toolCall : toolCalls) {
                messages.add(executeToolCall(toolCall, authentication));
            }
        }

        Map<String, Object> finalMessage = requestAssistantMessage(messages, false);
        Object content = finalMessage.get("content");
        return content instanceof String answer && !answer.isBlank()
            ? answer
            : "Je n'ai pas pu finaliser la demande. Pouvez-vous reformuler ?";
    }

    private Map<String, Object> requestAssistantMessage(List<Map<String, Object>> messages, boolean withTools) {
        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("model", model);
        requestBody.put("temperature", 0.2);
        requestBody.put("messages", messages);
        if (withTools) {
            requestBody.put("tools", tools());
            requestBody.put("tool_choice", "auto");
        }

        Map<?, ?> response = restClient.post()
            .uri("/chat/completions")
            .header("Authorization", "Bearer " + apiKey)
            .contentType(MediaType.APPLICATION_JSON)
            .body(requestBody)
            .retrieve()
            .body(Map.class);

        if (response == null || !response.containsKey("choices")) {
            return Map.of("role", "assistant", "content", "Aucune reponse recue de l'assistant IA.");
        }

        List<?> choices = (List<?>) response.get("choices");
        if (choices.isEmpty()) {
            return Map.of("role", "assistant", "content", "Aucune reponse recue de l'assistant IA.");
        }

        Map<?, ?> choice = (Map<?, ?>) choices.get(0);
        Object message = choice.get("message");
        if (message instanceof Map<?, ?> messageMap) {
            return toStringObjectMap(messageMap);
        }
        return Map.of("role", "assistant", "content", "Reponse IA invalide.");
    }

    private Map<String, Object> toAssistantToolCallMessage(
            Map<String, Object> assistantMessage,
            List<Map<String, Object>> toolCalls) {
        Map<String, Object> message = new LinkedHashMap<>();
        message.put("role", "assistant");
        message.put("content", assistantMessage.getOrDefault("content", ""));
        message.put("tool_calls", toolCalls);
        return message;
    }

    private Map<String, Object> executeToolCall(Map<String, Object> toolCall, Authentication authentication) {
        String toolCallId = stringValue(toolCall.get("id"));
        Map<String, Object> function = toStringObjectMap((Map<?, ?>) toolCall.get("function"));
        String functionName = stringValue(function.get("name"));
        Map<String, Object> arguments = parseArguments(stringValue(function.get("arguments")));

        String result;
        try {
            result = switch (functionName) {
                case "get_doctors" -> getDoctors(arguments);
                case "get_available_slots" -> getAvailableSlots(arguments);
                case "create_appointment" -> createAppointment(arguments, authentication);
                case "get_my_appointments" -> getMyAppointments(authentication);
                case "get_my_medical_followup" -> getMyMedicalFollowup(authentication);
                default -> "Outil inconnu: " + functionName;
            };
        } catch (Exception ex) {
            log.warn("Chat tool {} failed: {}", functionName, ex.getMessage());
            result = "La fonctionnalite a rencontre une erreur: " + ex.getMessage();
        }

        Map<String, Object> toolMessage = new LinkedHashMap<>();
        toolMessage.put("role", "tool");
        toolMessage.put("tool_call_id", toolCallId);
        toolMessage.put("content", result);
        return toolMessage;
    }

    private String getDoctors(Map<String, Object> arguments) {
        String search = stringValue(arguments.get("search"));
        Page<MedecinResponse> doctors = medecinService.getAll(
            search,
            PageRequest.of(0, 20, Sort.by(Sort.Direction.ASC, "nom"))
        );

        List<Map<String, Object>> payload = doctors.getContent().stream()
            .map(doctor -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id", doctor.getId());
                item.put("nom", doctor.getNom());
                item.put("prenom", doctor.getPrenom());
                item.put("specialite", doctor.getSpecialite());
                item.put("telephone", doctor.getTelephone());
                item.put("email", doctor.getEmail());
                return item;
            })
            .toList();

        return toJson(Map.of("doctors", payload, "count", payload.size()));
    }

    private String getAvailableSlots(Map<String, Object> arguments) {
        Long medecinId = longValue(arguments.get("medecinId"));
        LocalDate date = LocalDate.parse(stringValue(arguments.get("date")));
        List<String> slots = rendezVousService.getDisponibilites(medecinId, date);
        return toJson(Map.of("medecinId", medecinId, "date", date.toString(), "availableSlots", slots));
    }

    private String createAppointment(Map<String, Object> arguments, Authentication authentication) {
        Optional<String> patientEmail = authenticatedPatientEmail(authentication);
        if (patientEmail.isEmpty()) {
            return "Le patient doit etre connecte pour utiliser cette fonctionnalite.";
        }

        PatientResponse patient = patientService.getMe(patientEmail.get());
        RendezVousRequest request = new RendezVousRequest();
        request.setPatientId(patient.getId());
        request.setMedecinId(longValue(arguments.get("medecinId")));
        request.setDateHeure(parseAppointmentDateTime(arguments));
        request.setMotif(optionalString(arguments.get("motif")).orElse("Rendez-vous pris via Rahma Assistant"));
        request.setNotes(optionalString(arguments.get("notes")).orElse(null));

        RendezVousResponse appointment = rendezVousService.creerRendezVous(request);
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id", appointment.getId());
        payload.put("dateHeure", appointment.getDateHeure().toString());
        payload.put("statut", appointment.getStatut().name());
        payload.put("medecin", appointment.getMedecinPrenom() + " " + appointment.getMedecinNom());
        payload.put("specialite", appointment.getMedecinSpecialite());
        payload.put("motif", appointment.getMotif());
        return toJson(payload);
    }

    private String getMyAppointments(Authentication authentication) {
        Optional<String> patientEmail = authenticatedPatientEmail(authentication);
        if (patientEmail.isEmpty()) {
            return "Le patient doit etre connecte pour utiliser cette fonctionnalite.";
        }

        Page<RendezVousResponse> appointments = rendezVousService.getMyRdvs(
            patientEmail.get(),
            PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "dateHeure"))
        );

        List<Map<String, Object>> payload = appointments.getContent().stream()
            .map(appointment -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id", appointment.getId());
                item.put("dateHeure", appointment.getDateHeure());
                item.put("statut", appointment.getStatut());
                item.put("motif", appointment.getMotif());
                item.put("medecin", appointment.getMedecinPrenom() + " " + appointment.getMedecinNom());
                item.put("specialite", appointment.getMedecinSpecialite());
                return item;
            })
            .toList();

        return toJson(Map.of("appointments", payload, "count", payload.size()));
    }

    private String getMyMedicalFollowup(Authentication authentication) {
        Optional<String> patientEmail = authenticatedPatientEmail(authentication);
        if (patientEmail.isEmpty()) {
            return "Le patient doit etre connecte pour utiliser cette fonctionnalite.";
        }

        PatientResponse patient = patientService.getMe(patientEmail.get());
        Page<ConsultationResponse> consultations = consultationService.getByPatient(
            patient.getId(),
            PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "dateVisite"))
        );

        List<Map<String, Object>> payload = consultations.getContent().stream()
            .map(consultation -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id", consultation.getId());
                item.put("dateVisite", consultation.getDateVisite());
                item.put("motif", consultation.getMotif());
                item.put("diagnosticPatient", consultation.getDiagnosticPatient());
                item.put("actesRealises", consultation.getActesRealises());
                item.put("medecin", consultation.getMedecinPrenom() + " " + consultation.getMedecinNom());
                item.put("specialite", consultation.getMedecinSpecialite());
                return item;
            })
            .toList();

        return toJson(Map.of("consultations", payload, "count", payload.size()));
    }

    private Optional<String> authenticatedPatientEmail(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return Optional.empty();
        }

        boolean isPatient = authentication.getAuthorities().stream()
            .anyMatch(authority -> "ROLE_PATIENT".equals(authority.getAuthority()));
        if (!isPatient) {
            return Optional.empty();
        }

        return Optional.ofNullable(authentication.getName());
    }

    private LocalDateTime parseAppointmentDateTime(Map<String, Object> arguments) {
        Optional<String> dateTime = optionalString(arguments.get("dateHeure"));
        if (dateTime.isPresent()) {
            return LocalDateTime.parse(dateTime.get());
        }

        LocalDate date = LocalDate.parse(stringValue(arguments.get("date")));
        LocalTime time = LocalTime.parse(stringValue(arguments.get("heure")));
        return LocalDateTime.of(date, time);
    }

    private String buildSystemPrompt() {
        LocalDate today = LocalDate.now(CABINET_ZONE);
        return """
            Tu es Rahma Assistant, l'assistant IA du cabinet medical Rahma.
            Date du jour au Maroc: %s.

            Persona:
            - Reponds en francais, avec un ton clair, chaleureux et professionnel.
            - Aide les patients a trouver un medecin, verifier des disponibilites, prendre rendez-vous, consulter leurs rendez-vous et leur suivi medical.
            - Ne donne jamais de diagnostic, de prescription, ni de consigne medicale definitive. Pour les symptomes, conseille de consulter un medecin. Pour une urgence, conseille d'appeler les urgences ou de se rendre au service d'urgence le plus proche.

            Regles:
            - Utilise les outils quand la question concerne des donnees du cabinet, des disponibilites, une creation de rendez-vous ou des informations personnelles du patient.
            - Si le contexte indique que le patient est authentifie, ne lui demande pas de se reconnecter: appelle directement l'outil adapte.
            - N'invente pas les medecins, les horaires, les rendez-vous ou les consultations. Si un outil ne retourne rien, dis-le simplement.
            - Avant de creer un rendez-vous, assure-toi d'avoir le medecin, la date, l'heure et le motif. Si une information manque, pose une question courte.
            - Les fonctionnalites personnelles necessitent un patient connecte. Si l'outil indique que le patient doit etre connecte, explique-le poliment.
            - Presente les dates et heures de maniere lisible.
            """.formatted(today);
    }

    private String buildAuthenticationContext(Authentication authentication) {
        Optional<String> patientEmail = authenticatedPatientEmail(authentication);
        if (patientEmail.isPresent()) {
            return "Contexte d'authentification: le patient est authentifie avec l'email "
                + patientEmail.get()
                + ". Les outils get_my_appointments, get_my_medical_followup et create_appointment peuvent etre utilises.";
        }

        return "Contexte d'authentification: aucun patient authentifie n'a ete detecte pour cette requete.";
    }

    private List<Map<String, Object>> tools() {
        return List.of(
            functionTool(
                "get_doctors",
                "Recupere la liste des medecins du cabinet, avec une recherche optionnelle par nom, prenom ou specialite.",
                Map.of(
                    "type", "object",
                    "properties", Map.of(
                        "search", Map.of("type", "string", "description", "Texte de recherche optionnel.")
                    )
                )
            ),
            functionTool(
                "get_available_slots",
                "Verifie les creneaux disponibles pour un medecin a une date donnee.",
                Map.of(
                    "type", "object",
                    "properties", Map.of(
                        "medecinId", Map.of("type", "integer", "description", "Identifiant du medecin."),
                        "date", Map.of("type", "string", "description", "Date au format YYYY-MM-DD.")
                    ),
                    "required", List.of("medecinId", "date")
                )
            ),
            functionTool(
                "create_appointment",
                "Cree un rendez-vous pour le patient actuellement connecte.",
                Map.of(
                    "type", "object",
                    "properties", Map.of(
                        "medecinId", Map.of("type", "integer", "description", "Identifiant du medecin."),
                        "date", Map.of("type", "string", "description", "Date au format YYYY-MM-DD."),
                        "heure", Map.of("type", "string", "description", "Heure au format HH:mm, par exemple 09:30."),
                        "motif", Map.of("type", "string", "description", "Motif du rendez-vous."),
                        "notes", Map.of("type", "string", "description", "Notes optionnelles.")
                    ),
                    "required", List.of("medecinId", "date", "heure", "motif")
                )
            ),
            functionTool(
                "get_my_appointments",
                "Recupere les rendez-vous du patient actuellement connecte.",
                Map.of("type", "object", "properties", Map.of())
            ),
            functionTool(
                "get_my_medical_followup",
                "Recupere les anciennes consultations et le suivi medical visible par le patient actuellement connecte.",
                Map.of("type", "object", "properties", Map.of())
            )
        );
    }

    private Map<String, Object> functionTool(String name, String description, Map<String, Object> parameters) {
        return Map.of(
            "type", "function",
            "function", Map.of(
                "name", name,
                "description", description,
                "parameters", parameters
            )
        );
    }

    private List<Map<String, Object>> extractToolCalls(Map<String, Object> assistantMessage) {
        Object toolCalls = assistantMessage.get("tool_calls");
        if (!(toolCalls instanceof List<?> rawToolCalls)) {
            return List.of();
        }
        return rawToolCalls.stream()
            .filter(Map.class::isInstance)
            .map(toolCall -> toStringObjectMap((Map<?, ?>) toolCall))
            .toList();
    }

    private Map<String, Object> parseArguments(String arguments) {
        if (arguments == null || arguments.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(arguments, new TypeReference<>() {});
        } catch (Exception ex) {
            log.warn("Unable to parse tool arguments: {}", arguments);
            return Map.of();
        }
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            return String.valueOf(value);
        }
    }

    private Long longValue(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(stringValue(value));
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private Optional<String> optionalString(Object value) {
        String string = stringValue(value);
        return string.isBlank() ? Optional.empty() : Optional.of(string);
    }

    private Map<String, Object> toStringObjectMap(Map<?, ?> source) {
        Map<String, Object> target = new LinkedHashMap<>();
        source.forEach((key, value) -> target.put(String.valueOf(key), value));
        return target;
    }

    public String aiFallback(List<ChatRequest.Message> chatHistory, Authentication authentication, Exception ex) {
        log.warn("AI service unavailable: {}", ex.getMessage());
        return "L'assistant IA est temporairement indisponible.";
    }
}
