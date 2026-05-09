package com.cabinet.medical.service;

import com.cabinet.medical.dto.request.ChatRequest.ChatMessageDto;
import com.cabinet.medical.dto.request.RendezVousRequest;
import com.cabinet.medical.dto.response.ConsultationResponse;
import com.cabinet.medical.dto.response.MedecinResponse;
import com.cabinet.medical.dto.response.PatientResponse;
import com.cabinet.medical.dto.response.RendezVousResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Agentic AI chat service — OpenAI function-calling loop.
 *
 * <p>Each call to {@link #chat} runs up to {@value #MAX_ITERATIONS} iterations.
 * On each iteration the full conversation (system prompt + caller history +
 * accumulated tool results) is sent to the OpenAI chat-completions endpoint.
 * When the model requests tool calls they are dispatched to the appropriate
 * Spring service methods; results are appended and the loop continues until a
 * {@code "stop"} finish-reason is received or the cap is reached.
 *
 * <p>{@code POST /api/v1/chat} is {@code permitAll()} so the SecurityContext
 * may be anonymous. Tools that need an authenticated PATIENT check
 * {@link SecurityContextHolder} and return a localised error string to the LLM
 * when the caller is not logged in.
 */
@Service
@Slf4j
public class ChatAiService {

    // ── Constants ─────────────────────────────────────────────────────────────

    private static final int    MAX_ITERATIONS = 6;
    private static final String ANONYMOUS      = "anonymousUser";

    // ── Dependencies ──────────────────────────────────────────────────────────

    private final RestClient          restClient;
    private final ObjectMapper        objectMapper;
    private final MedecinService      medecinService;
    private final RendezVousService   rendezVousService;
    private final PatientService      patientService;
    private final ConsultationService consultationService;

    @Value("${spring.ai.openai.api-key:YOUR_OPENAI_API_KEY}")
    private String apiKey;

    @Value("${spring.ai.openai.chat.model:gpt-4o}")
    private String model;

    // ── Constructor ───────────────────────────────────────────────────────────

    public ChatAiService(ObjectMapper objectMapper,
                         MedecinService medecinService,
                         RendezVousService rendezVousService,
                         PatientService patientService,
                         ConsultationService consultationService) {
        this.restClient = RestClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .build();
        this.objectMapper        = objectMapper;
        this.medecinService      = medecinService;
        this.rendezVousService   = rendezVousService;
        this.patientService      = patientService;
        this.consultationService = consultationService;
    }

    // ── Public API ────────────────────────────────────────────────────────────

    @CircuitBreaker(name = "aiService", fallbackMethod = "aiFallback")
    public String chat(List<ChatMessageDto> history) {
        if ("YOUR_OPENAI_API_KEY".equals(apiKey) || apiKey == null || apiKey.isBlank()) {
            return "L'assistant IA n'est pas configuré. " +
                   "Veuillez définir `spring.ai.openai.api-key` dans application.properties.";
        }

        // Initial message list: system prompt followed by the caller's history
        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(mkMessage("system", buildSystemPrompt()));
        for (ChatMessageDto dto : history) {
            messages.add(mkMessage(dto.getRole(), dto.getContent()));
        }

        String finalText = "";

        for (int iter = 0; iter < MAX_ITERATIONS; iter++) {

            // ── Call OpenAI ───────────────────────────────────────────────────
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("model",    model);
            body.put("messages", messages);
            body.put("tools",    buildTools());

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.post()
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (response == null) break;

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> choices =
                    (List<Map<String, Object>>) response.get("choices");
            if (choices == null || choices.isEmpty()) break;

            Map<String, Object> choice  = choices.get(0);
            @SuppressWarnings("unchecked")
            Map<String, Object> message = (Map<String, Object>) choice.get("message");
            String              finish  = (String) choice.get("finish_reason");

            // Capture any text (may be null when tool_calls is the finish reason)
            if (message.get("content") instanceof String text) {
                finalText = text;
            }

            // ── End of turn ───────────────────────────────────────────────────
            if ("stop".equals(finish)) break;

            // ── Tool calls ────────────────────────────────────────────────────
            if ("tool_calls".equals(finish)) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> toolCalls =
                        (List<Map<String, Object>>) message.get("tool_calls");

                // Append assistant turn (with tool_calls) to the running history
                Map<String, Object> assistantMsg = new LinkedHashMap<>();
                assistantMsg.put("role",       "assistant");
                assistantMsg.put("content",    message.get("content")); // may be null — OK
                assistantMsg.put("tool_calls", toolCalls);
                messages.add(assistantMsg);

                // Execute each tool and append its result
                for (Map<String, Object> tc : toolCalls) {
                    String toolCallId = (String) tc.get("id");
                    @SuppressWarnings("unchecked")
                    Map<String, Object> func = (Map<String, Object>) tc.get("function");
                    String toolName          = (String) func.get("name");
                    String argsJson          = (String) func.get("arguments");

                    String result = executeTool(toolName, argsJson);
                    log.debug("Tool [{}] → {}", toolName, result);

                    Map<String, Object> toolMsg = new LinkedHashMap<>();
                    toolMsg.put("role",         "tool");
                    toolMsg.put("tool_call_id", toolCallId);
                    toolMsg.put("content",      result);
                    messages.add(toolMsg);
                }
                continue; // next iteration
            }

            // Any other finish reason (content_filter, length, …)
            break;
        }

        return finalText.isBlank()
                ? "Désolé, je n'ai pas pu traiter votre demande."
                : finalText;
    }

    /** Circuit-breaker fallback. */
    public String aiFallback(List<ChatMessageDto> history, Exception ex) {
        log.warn("[ChatAiService] AI service unavailable: {}", ex.getMessage());
        return "L'assistant IA est temporairement indisponible. " +
               "Veuillez réessayer dans quelques instants.";
    }

    // ── Tool dispatcher ───────────────────────────────────────────────────────

    private String executeTool(String name, String argsJson) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> args = objectMapper.readValue(argsJson, Map.class);
            return switch (name) {
                case "get_doctors"             -> toolGetDoctors(args);
                case "get_available_slots"     -> toolGetAvailableSlots(args);
                case "create_appointment"      -> toolCreateAppointment(args);
                case "get_my_appointments"     -> toolGetMyAppointments();
                case "get_my_medical_followup" -> toolGetMyMedicalFollowup();
                default -> jsonError("Outil inconnu : " + name);
            };
        } catch (Exception e) {
            log.error("[executeTool] {} failed: {}", name, e.getMessage(), e);
            return jsonError(e.getMessage());
        }
    }

    // ── Tool implementations ──────────────────────────────────────────────────

    /** Lists doctors, optionally filtered by a search term. */
    private String toolGetDoctors(Map<String, Object> args) throws Exception {
        String search = args.get("search") instanceof String s ? s : null;
        Page<MedecinResponse> page =
                medecinService.getAll(search, PageRequest.of(0, 50));
        if (page.isEmpty()) return "Aucun médecin trouvé.";
        List<Map<String, Object>> list = page.getContent().stream()
                .map(m -> {
                    Map<String, Object> doc = new LinkedHashMap<>();
                    doc.put("id",         m.getId());
                    doc.put("nom",        "Dr. " + m.getPrenom() + " " + m.getNom());
                    doc.put("specialite", m.getSpecialite());
                    doc.put("telephone",  m.getTelephone() != null ? m.getTelephone() : "—");
                    return doc;
                }).toList();
        return objectMapper.writeValueAsString(list);
    }

    /** Returns free 30-minute slots for the given doctor on the given date. */
    private String toolGetAvailableSlots(Map<String, Object> args) throws Exception {
        Long      medecinId = toLong(args.get("medecinId"));
        LocalDate date      = LocalDate.parse((String) args.get("date"));
        List<String> slots  = rendezVousService.getDisponibilites(medecinId, date);
        if (slots.isEmpty()) {
            return "Aucun créneau disponible le " + date + ". Essayez une autre date.";
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("date",     date.toString());
        result.put("creneaux", slots);
        return objectMapper.writeValueAsString(result);
    }

    /**
     * Books an appointment for the currently authenticated PATIENT.
     * The service layer ({@link RendezVousService#creerRendezVous}) re-verifies
     * patient ownership via the SecurityContext, so no extra check is needed here
     * beyond confirming the caller is a non-anonymous PATIENT.
     */
    private String toolCreateAppointment(Map<String, Object> args) throws Exception {
        Authentication auth = currentAuth();
        if (isAnonymous(auth)) {
            return "Le patient doit être connecté pour créer un rendez-vous.";
        }
        if (!hasRole(auth, "ROLE_PATIENT")) {
            return "Cette fonctionnalité est réservée aux patients connectés.";
        }

        PatientResponse patient  = patientService.getMe(auth.getName());
        Long          medecinId  = toLong(args.get("medecinId"));
        LocalDateTime dateHeure  = LocalDateTime.parse((String) args.get("dateHeure"));
        String        motif      = (String) args.get("motif");
        String        notes      = args.get("notes") instanceof String s ? s : null;

        RendezVousRequest req = new RendezVousRequest();
        req.setPatientId(patient.getId());
        req.setMedecinId(medecinId);
        req.setDateHeure(dateHeure);
        req.setMotif(motif);
        req.setNotes(notes);

        RendezVousResponse rdv = rendezVousService.creerRendezVous(req);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("succès",    true);
        result.put("message",   "Rendez-vous créé avec succès !");
        result.put("id",        rdv.getId());
        result.put("dateHeure", rdv.getDateHeure() != null ? rdv.getDateHeure().toString() : null);
        result.put("medecin",   "Dr. " + rdv.getMedecinPrenom() + " " + rdv.getMedecinNom());
        result.put("motif",     rdv.getMotif());
        result.put("statut",    rdv.getStatut() != null ? rdv.getStatut().name() : null);
        return objectMapper.writeValueAsString(result);
    }

    /** Returns the authenticated patient's appointment list (newest first). */
    private String toolGetMyAppointments() throws Exception {
        Authentication auth = currentAuth();
        if (isAnonymous(auth)) {
            return "Le patient doit être connecté pour consulter ses rendez-vous.";
        }
        Page<RendezVousResponse> page = rendezVousService.getMyRdvs(
                auth.getName(),
                PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "dateHeure")));
        if (page.isEmpty()) return "Vous n'avez aucun rendez-vous enregistré.";
        List<Map<String, Object>> list = page.getContent().stream()
                .map(r -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id",         r.getId());
                    m.put("dateHeure",  r.getDateHeure() != null ? r.getDateHeure().toString() : null);
                    m.put("medecin",    "Dr. " + r.getMedecinPrenom() + " " + r.getMedecinNom());
                    m.put("specialite", r.getMedecinSpecialite());
                    m.put("motif",      r.getMotif());
                    m.put("statut",     r.getStatut() != null ? r.getStatut().name() : null);
                    return m;
                }).toList();
        return objectMapper.writeValueAsString(list);
    }

    /** Returns the authenticated patient's consultation history. */
    private String toolGetMyMedicalFollowup() throws Exception {
        Authentication auth = currentAuth();
        if (isAnonymous(auth)) {
            return "Le patient doit être connecté pour consulter son suivi médical.";
        }
        PatientResponse patient = patientService.getMe(auth.getName());
        Page<ConsultationResponse> page =
                consultationService.getByPatient(patient.getId(), PageRequest.of(0, 20));
        if (page.isEmpty()) return "Aucune consultation enregistrée.";
        List<Map<String, Object>> list = page.getContent().stream()
                .map(c -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id",                c.getId());
                    m.put("date",              c.getDateVisite() != null ? c.getDateVisite().toString() : null);
                    m.put("medecin",           "Dr. " + c.getMedecinPrenom() + " " + c.getMedecinNom());
                    m.put("motif",             c.getMotif());
                    m.put("diagnosticPatient", c.getDiagnosticPatient());
                    m.put("actesRealises",     c.getActesRealises());
                    m.put("montantTotal",      c.getMontantTotal());
                    return m;
                }).toList();
        return objectMapper.writeValueAsString(list);
    }

    // ── Tool schema definitions ───────────────────────────────────────────────

    private List<Map<String, Object>> buildTools() {
        return List.of(
            tool("get_doctors",
                "Récupère la liste des médecins du cabinet avec leurs spécialités et informations. " +
                "Utilise cet outil pour aider le patient à choisir un médecin ou pour répondre à " +
                "des questions sur les médecins disponibles.",
                params("type", "object",
                       "properties", Map.of(
                           "search", Map.of(
                               "type", "string",
                               "description", "Terme de recherche optionnel (nom, prénom ou spécialité)"
                           )
                       ),
                       "required", List.of())
            ),
            tool("get_available_slots",
                "Récupère les créneaux horaires disponibles pour un médecin donné à une date donnée. " +
                "Appelle cet outil une fois que le patient a choisi un médecin et une date.",
                params("type", "object",
                       "properties", Map.of(
                           "medecinId", Map.of("type", "number",
                               "description", "L'identifiant du médecin"),
                           "date", Map.of("type", "string",
                               "description", "La date souhaitée au format YYYY-MM-DD")
                       ),
                       "required", List.of("medecinId", "date"))
            ),
            tool("create_appointment",
                "Crée un nouveau rendez-vous pour le patient. " +
                "N'appelle cet outil QUE APRÈS avoir confirmé tous les détails avec le patient : " +
                "médecin, date, heure et motif.",
                params("type", "object",
                       "properties", Map.of(
                           "medecinId", Map.of("type", "number",
                               "description", "L'identifiant du médecin"),
                           "dateHeure", Map.of("type", "string",
                               "description", "Date et heure ISO : YYYY-MM-DDTHH:MM:SS"),
                           "motif", Map.of("type", "string",
                               "description", "Motif de la consultation"),
                           "notes", Map.of("type", "string",
                               "description", "Notes supplémentaires optionnelles")
                       ),
                       "required", List.of("medecinId", "dateHeure", "motif"))
            ),
            tool("get_my_appointments",
                "Récupère les rendez-vous du patient connecté (passés et à venir). " +
                "Utilise cet outil quand le patient veut connaître ses rendez-vous.",
                params("type", "object",
                       "properties", Collections.emptyMap(),
                       "required", List.of())
            ),
            tool("get_my_medical_followup",
                "Récupère l'historique des consultations médicales du patient connecté. " +
                "Utilise cet outil quand le patient pose des questions sur son suivi médical, " +
                "ses traitements ou ses consultations passées.",
                params("type", "object",
                       "properties", Collections.emptyMap(),
                       "required", List.of())
            )
        );
    }

    /** Wraps a function definition in the OpenAI tool envelope. */
    private Map<String, Object> tool(String name, String description,
                                     Map<String, Object> parameters) {
        Map<String, Object> fn = new LinkedHashMap<>();
        fn.put("name",        name);
        fn.put("description", description);
        fn.put("parameters",  parameters);
        Map<String, Object> wrapper = new LinkedHashMap<>();
        wrapper.put("type",     "function");
        wrapper.put("function", fn);
        return wrapper;
    }

    /** Builds a plain key-value {@link Map} from interleaved pairs. */
    private Map<String, Object> params(Object... kvPairs) {
        Map<String, Object> m = new LinkedHashMap<>();
        for (int i = 0; i < kvPairs.length; i += 2) {
            m.put((String) kvPairs[i], kvPairs[i + 1]);
        }
        return m;
    }

    // ── Message helpers ───────────────────────────────────────────────────────

    private Map<String, Object> mkMessage(String role, String content) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("role",    role);
        m.put("content", content);
        return m;
    }

    // ── System prompt ─────────────────────────────────────────────────────────

    private String buildSystemPrompt() {
        String today = LocalDate.now()
                .format(DateTimeFormatter.ofPattern("EEEE d MMMM yyyy", Locale.FRENCH));
        return "Tu es Rahma Assistant, un assistant médical IA chaleureux et professionnel "
             + "du Cabinet Médical Rahma.\n\n"
             + "## Ton rôle\n"
             + "Tu aides les patients à :\n"
             + "- 📅 **Prendre un rendez-vous** — en les guidant pas à pas\n"
             + "- 📋 **Consulter leurs rendez-vous** — historique et prochains RDV\n"
             + "- 🩺 **Suivre leur parcours médical** — consultations passées et traitements\n"
             + "- 👨‍⚕️ **Connaître nos médecins** — spécialités, disponibilités\n\n"
             + "## Pour créer un rendez-vous, recueille ces informations dans l'ordre :\n"
             + "1. **Spécialité ou médecin souhaité**\n"
             + "2. **Date souhaitée** — doit être une date future\n"
             + "3. **Créneau horaire** — montre les disponibilités et laisse le patient choisir\n"
             + "4. **Motif de la consultation**\n\n"
             + "## Règles importantes :\n"
             + "- Pose **une seule question à la fois**\n"
             + "- **Confirme toujours** tous les détails avant de créer le RDV\n"
             + "- Propose des **alternatives** si un créneau n'est pas disponible\n"
             + "- Après création, **résume** le rendez-vous réservé\n"
             + "- Sois toujours **empathique**, clair et professionnel\n"
             + "- Réponds dans la **même langue que le patient** — par défaut en français\n\n"
             + "## Date du jour : " + today;
    }

    // ── Security helpers ──────────────────────────────────────────────────────

    private Authentication currentAuth() {
        return SecurityContextHolder.getContext().getAuthentication();
    }

    private boolean isAnonymous(Authentication auth) {
        return auth == null || !auth.isAuthenticated() || ANONYMOUS.equals(auth.getName());
    }

    private boolean hasRole(Authentication auth, String role) {
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(role));
    }

    // ── Type coercion ─────────────────────────────────────────────────────────

    private Long toLong(Object value) {
        if (value instanceof Number n)  return n.longValue();
        if (value instanceof String s)  return Long.parseLong(s);
        throw new IllegalArgumentException("Cannot convert to Long: " + value);
    }

    private String jsonError(String message) {
        return "{\"erreur\":\"" + message.replace("\"", "'") + "\"}";
    }
}
