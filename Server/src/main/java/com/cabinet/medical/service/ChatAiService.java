package com.cabinet.medical.service;

import com.cabinet.medical.dto.request.ChatRequest.Message;
import com.cabinet.medical.dto.request.RegisterRequest;
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
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Slf4j
public class ChatAiService {

    // ── Constants ─────────────────────────────────────────────────────────────

    private static final int    MAX_ITERATIONS = 10;
    private static final String ANONYMOUS      = "anonymousUser";

    // ── Config ────────────────────────────────────────────────────────────────

    @Value("${spring.ai.openai.api-key:}")
    private String apiKey;

    @Value("${spring.ai.openai.chat.model:gpt-4o}")
    private String model;

    // ── Dependencies ──────────────────────────────────────────────────────────

    private final RestClient          restClient;
    private final ObjectMapper        objectMapper;
    private final MedecinService      medecinService;
    private final RendezVousService   rendezVousService;
    private final PatientService      patientService;
    private final ConsultationService consultationService;
    private final AuthService         authService;

    // ── Constructor (Spring uses this — NO @RequiredArgsConstructor) ──────────

    public ChatAiService(ObjectMapper objectMapper,
                         MedecinService medecinService,
                         RendezVousService rendezVousService,
                         PatientService patientService,
                         ConsultationService consultationService,
                         AuthService authService) {
        this.restClient = RestClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .build();
        this.objectMapper        = objectMapper;
        this.medecinService      = medecinService;
        this.rendezVousService   = rendezVousService;
        this.patientService      = patientService;
        this.consultationService = consultationService;
        this.authService         = authService;
    }

    // ── Public API ────────────────────────────────────────────────────────────

    @CircuitBreaker(name = "aiService", fallbackMethod = "aiFallback")
    public String chat(List<Message> history, Authentication auth) {
        if (apiKey == null || apiKey.isBlank()) {
            return "L'assistant IA n'est pas configuré. " +
                   "Veuillez définir `spring.ai.openai.api-key` dans application.properties.";
        }

        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(mkMessage("system", buildSystemPrompt()));
        for (Message dto : history) {
            messages.add(mkMessage(dto.getRole(), dto.getContent()));
        }

        String finalText = "";

        for (int iter = 0; iter < MAX_ITERATIONS; iter++) {
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

            if (message.get("content") instanceof String text) {
                finalText = text;
            }

            if ("stop".equals(finish)) break;

            if ("tool_calls".equals(finish)) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> toolCalls =
                        (List<Map<String, Object>>) message.get("tool_calls");

                Map<String, Object> assistantMsg = new LinkedHashMap<>();
                assistantMsg.put("role",       "assistant");
                assistantMsg.put("content",    message.get("content"));
                assistantMsg.put("tool_calls", toolCalls);
                messages.add(assistantMsg);

                for (Map<String, Object> tc : toolCalls) {
                    String toolCallId = (String) tc.get("id");
                    @SuppressWarnings("unchecked")
                    Map<String, Object> func = (Map<String, Object>) tc.get("function");
                    String toolName          = (String) func.get("name");
                    String argsJson          = (String) func.get("arguments");

                    String result = executeTool(toolName, argsJson, auth);
                    log.debug("Tool [{}] → {}", toolName, result);

                    Map<String, Object> toolMsg = new LinkedHashMap<>();
                    toolMsg.put("role",         "tool");
                    toolMsg.put("tool_call_id", toolCallId);
                    toolMsg.put("content",      result);
                    messages.add(toolMsg);
                }
                continue;
            }

            break;
        }

        return finalText.isBlank()
                ? "Désolé, je n'ai pas pu traiter votre demande."
                : finalText;
    }

    /** Circuit-breaker fallback — signature must match chat() plus Exception. */
    public String aiFallback(List<Message> history, Authentication auth, Exception ex) {
        log.warn("[ChatAiService] AI service unavailable: {}", ex.getMessage());
        return "L'assistant IA est temporairement indisponible. Veuillez réessayer.";
    }

    // ── Tool dispatcher ───────────────────────────────────────────────────────

    private String executeTool(String name, String argsJson, Authentication auth) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> args = objectMapper.readValue(argsJson, Map.class);
            return switch (name) {
                case "get_doctors"             -> toolGetDoctors(args);
                case "get_available_slots"     -> toolGetAvailableSlots(args);
                case "register_patient"        -> toolRegisterPatient(args);
                case "create_appointment"      -> toolCreateAppointment(args, auth);
                case "get_my_appointments"     -> toolGetMyAppointments(auth);
                case "get_my_medical_followup" -> toolGetMyMedicalFollowup(auth);
                default -> jsonError("Outil inconnu : " + name);
            };
        } catch (Exception e) {
            log.error("[executeTool] {} failed: {}", name, e.getMessage(), e);
            return jsonError(e.getMessage());
        }
    }

    // ── Tool implementations ──────────────────────────────────────────────────

    private String toolGetDoctors(Map<String, Object> args) throws Exception {
        String search = args.get("search") instanceof String s ? s : null;
        Page<MedecinResponse> page = medecinService.getAll(search, PageRequest.of(0, 50));
        if (page.isEmpty()) return "Aucun médecin trouvé.";
        // IDs are intentionally omitted — the LLM must use doctor names (strings),
        // never numeric IDs, for get_available_slots and create_appointment.
        List<Map<String, Object>> list = page.getContent().stream().map(m -> {
            Map<String, Object> doc = new LinkedHashMap<>();
            doc.put("nom",        "Dr. " + m.getPrenom() + " " + m.getNom());
            doc.put("specialite", m.getSpecialite());
            doc.put("telephone",  m.getTelephone() != null ? m.getTelephone() : "—");
            return doc;
        }).toList();
        return objectMapper.writeValueAsString(list);
    }

    private String toolGetAvailableSlots(Map<String, Object> args) throws Exception {
        // Accept name (preferred) — the server resolves it to a database ID.
        String    medecinName = args.get("medecinName") instanceof String s ? s : null;
        LocalDate date        = LocalDate.parse((String) args.get("date"));

        MedecinResponse doc = resolveDoctor(medecinName);
        if (doc == null) {
            return "Médecin introuvable pour le nom : \"" + medecinName
                   + "\". Appelez d'abord get_doctors pour obtenir le nom exact.";
        }
        Long   medecinId  = doc.getId();
        String doctorLabel = "Dr. " + doc.getPrenom() + " " + doc.getNom();

        List<String> slots = rendezVousService.getDisponibilites(medecinId, date);
        if (slots.isEmpty()) {
            return "Aucun créneau disponible le " + date + " pour " + doctorLabel + ". Essayez une autre date.";
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("medecin",  doctorLabel);
        result.put("date",     date.toString());
        result.put("creneaux", slots);
        return objectMapper.writeValueAsString(result);
    }

    private String toolRegisterPatient(Map<String, Object> args) throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setNom(     (String) args.get("nom"));
        req.setPrenom(  (String) args.get("prenom"));
        req.setCin(     (String) args.get("cin"));
        req.setEmail(   (String) args.get("email"));
        req.setPassword((String) args.get("password"));
        if (args.get("telephone") instanceof String t) req.setTelephone(t);
        if (args.get("adresse")   instanceof String a) req.setAdresse(a);
        if (args.get("dateNaissance") instanceof String d)
            req.setDateNaissance(LocalDate.parse(d));

        try {
            authService.register(req);
        } catch (Exception e) {
            return jsonError("Inscription échouée : " + e.getMessage());
        }

        // Return the email so create_appointment can look up the patient without a JWT
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success",      true);
        result.put("message",      "Compte créé avec succès !");
        result.put("patientEmail", req.getEmail());
        result.put("info",
            "Transmets patientEmail=" + req.getEmail()
            + " à create_appointment pour finaliser le rendez-vous.");
        return objectMapper.writeValueAsString(result);
    }

    private String toolCreateAppointment(Map<String, Object> args, Authentication auth) throws Exception {
        // Resolve the patient — either from a live JWT or from a freshly registered email
        PatientResponse patient;
        if (!isAnonymous(auth)) {
            if (!hasRole(auth, "ROLE_PATIENT"))
                return "Cette fonctionnalité est réservée aux patients.";
            patient = patientService.getMe(auth.getName());
        } else if (args.get("patientEmail") instanceof String email && !email.isBlank()) {
            try {
                patient = patientService.getMe(email);
            } catch (Exception e) {
                return "Impossible de trouver le patient pour l'email : " + email
                       + ". Veuillez d'abord vous inscrire via register_patient.";
            }
        } else {
            return "Vous devez être connecté ou vous inscrire pour créer un rendez-vous. "
                   + "Appelez register_patient pour créer un compte.";
        }

        // Accept name — the server resolves it to a database ID.
        String medecinName = args.get("medecinName") instanceof String s ? s : null;
        MedecinResponse doc = resolveDoctor(medecinName);
        if (doc == null) {
            return "Médecin introuvable pour le nom : \"" + medecinName
                   + "\". Appelez d'abord get_doctors pour obtenir le nom exact.";
        }

        LocalDateTime   dateHeure = LocalDateTime.parse((String) args.get("dateHeure"));
        String          motif     = (String) args.get("motif");
        String          notes     = args.get("notes") instanceof String s ? s : null;

        RendezVousRequest req = new RendezVousRequest();
        req.setPatientId(patient.getId());
        req.setMedecinId(doc.getId());
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

    private String toolGetMyAppointments(Authentication auth) throws Exception {
        if (isAnonymous(auth)) return "Le patient doit être connecté pour consulter ses rendez-vous.";
        Page<RendezVousResponse> page = rendezVousService.getMyRdvs(
                auth.getName(), PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "dateHeure")));
        if (page.isEmpty()) return "Vous n'avez aucun rendez-vous enregistré.";
        List<Map<String, Object>> list = page.getContent().stream().map(r -> {
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

    private String toolGetMyMedicalFollowup(Authentication auth) throws Exception {
        if (isAnonymous(auth)) return "Le patient doit être connecté pour consulter son suivi médical.";
        PatientResponse patient = patientService.getMe(auth.getName());
        Page<ConsultationResponse> page =
                consultationService.getByPatient(patient.getId(), PageRequest.of(0, 20));
        if (page.isEmpty()) return "Aucune consultation enregistrée.";
        List<Map<String, Object>> list = page.getContent().stream().map(c -> {
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
                "Récupère la liste des médecins du cabinet avec leurs spécialités. " +
                "Utilise cet outil pour aider le patient à choisir un médecin.",
                params("type", "object",
                       "properties", Map.of(
                           "search", Map.of("type", "string",
                               "description", "Terme de recherche optionnel (nom, prénom ou spécialité)")
                       ),
                       "required", List.of())),
            tool("get_available_slots",
                "Récupère les créneaux disponibles pour un médecin à une date donnée. "
                + "Utilise le nom exact tel que retourné par get_doctors (ex: 'Dr. Benbakka Youness').",
                params("type", "object",
                       "properties", Map.of(
                           "medecinName", Map.of("type", "string",
                               "description", "Nom complet du médecin tel que retourné par get_doctors, ex: 'Dr. Benbakka Youness'"),
                           "date",        Map.of("type", "string",
                               "description", "La date au format YYYY-MM-DD")
                       ),
                       "required", List.of("medecinName", "date"))),
            tool("register_patient",
                "Inscrit un nouveau patient sur la plateforme. "
                + "Appelle cet outil après avoir collecté toutes les informations nécessaires. "
                + "Retourne un patientEmail à passer ensuite à create_appointment.",
                params("type", "object",
                       "properties", Map.of(
                           "nom",           Map.of("type", "string", "description", "Nom de famille"),
                           "prenom",        Map.of("type", "string", "description", "Prénom"),
                           "cin",           Map.of("type", "string", "description", "Numéro CIN (carte d'identité nationale)"),
                           "email",         Map.of("type", "string", "description", "Adresse email"),
                           "password",      Map.of("type", "string", "description", "Mot de passe (min 8 caractères)"),
                           "telephone",     Map.of("type", "string", "description", "Numéro de téléphone (optionnel)"),
                           "adresse",       Map.of("type", "string", "description", "Adresse postale (optionnel)"),
                           "dateNaissance", Map.of("type", "string", "description", "Date de naissance YYYY-MM-DD (optionnel)")
                       ),
                       "required", List.of("nom", "prenom", "cin", "email", "password"))),
            tool("create_appointment",
                "Crée un rendez-vous. Appelle SEULEMENT après confirmation du patient. "
                + "Utilise EXACTEMENT le même medecinName que celui passé à get_available_slots. "
                + "Pour un patient venant de s'inscrire, passe patientEmail retourné par register_patient.",
                params("type", "object",
                       "properties", Map.of(
                           "medecinName",  Map.of("type", "string",
                               "description", "Nom exact du médecin, identique à celui utilisé dans get_available_slots"),
                           "dateHeure",    Map.of("type", "string",
                               "description", "Date et heure ISO : YYYY-MM-DDTHH:MM:SS"),
                           "motif",        Map.of("type", "string",
                               "description", "Motif de la consultation"),
                           "notes",        Map.of("type", "string",
                               "description", "Notes optionnelles"),
                           "patientEmail", Map.of("type", "string",
                               "description", "Email du patient nouvellement inscrit (uniquement si register_patient vient d'être appelé)")
                       ),
                       "required", List.of("medecinName", "dateHeure", "motif"))),
            tool("get_my_appointments",
                "Récupère les rendez-vous du patient connecté.",
                params("type", "object", "properties", Collections.emptyMap(), "required", List.of())),
            tool("get_my_medical_followup",
                "Récupère l'historique des consultations du patient connecté.",
                params("type", "object", "properties", Collections.emptyMap(), "required", List.of()))
        );
    }

    private Map<String, Object> tool(String name, String description, Map<String, Object> parameters) {
        Map<String, Object> fn = new LinkedHashMap<>();
        fn.put("name",        name);
        fn.put("description", description);
        fn.put("parameters",  parameters);
        Map<String, Object> w = new LinkedHashMap<>();
        w.put("type",     "function");
        w.put("function", fn);
        return w;
    }

    private Map<String, Object> params(Object... kvPairs) {
        Map<String, Object> m = new LinkedHashMap<>();
        for (int i = 0; i < kvPairs.length; i += 2) m.put((String) kvPairs[i], kvPairs[i + 1]);
        return m;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Map<String, Object> mkMessage(String role, String content) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("role",    role);
        m.put("content", content);
        return m;
    }

    private String buildSystemPrompt() {
        String today = LocalDate.now()
                .format(DateTimeFormatter.ofPattern("EEEE d MMMM yyyy", Locale.FRENCH));
        return "Tu es Rahma Assistant, un assistant médical IA chaleureux et professionnel "
             + "du Cabinet Médical Rahma.\n\n"
             + "## Ton rôle\nTu aides les patients à :\n"
             + "- 📅 **Prendre un rendez-vous** — en les guidant pas à pas\n"
             + "- 📋 **Consulter leurs rendez-vous** — historique et prochains RDV\n"
             + "- 🩺 **Suivre leur parcours médical** — consultations passées\n"
             + "- 👨‍⚕️ **Connaître nos médecins** — spécialités, disponibilités\n\n"
             + "## Flux 1 — Prise de RDV (patient connecté) :\n"
             + "1. **Médecin souhaité** → get_doctors, présente les résultats\n"
             + "2. **Date souhaitée** (future)\n"
             + "3. **Créneaux** → get_available_slots(medecinName='Dr. Prénom Nom', date='YYYY-MM-DD')\n"
             + "4. **Motif** → confirmer → create_appointment\n\n"
             + "## Flux 2 — Prise de RDV (patient NON connecté) :\n"
             + "Si le patient n'est pas connecté et souhaite un rendez-vous, guide-le ainsi :\n"
             + "1. Informe-le qu'il faut un compte et propose de l'inscrire maintenant.\n"
             + "2. Collecte UNE information à la fois dans cet ordre :\n"
             + "   - Nom de famille\n"
             + "   - Prénom\n"
             + "   - CIN (numéro de carte d'identité nationale)\n"
             + "   - Email\n"
             + "   - Mot de passe (précise : minimum 8 caractères)\n"
             + "   - Téléphone (optionnel, dis-le au patient)\n"
             + "3. Appelle register_patient avec les informations collectées.\n"
             + "4. Si register_patient réussit, enchaîne IMMÉDIATEMENT avec le flux RDV (get_doctors → "
             + "get_available_slots → create_appointment) en passant patientEmail dans create_appointment.\n"
             + "5. À la fin, dis au patient que son compte a été créé et qu'il peut se connecter avec son email.\n\n"
             + "## Règles CRITIQUES :\n"
             + "- **N'utilise JAMAIS d'identifiant numérique (id)**. Utilise le **nom exact du médecin** "
             + "(ex: 'Dr. Benbakka Youness') pour get_available_slots et create_appointment.\n"
             + "- **COHÉRENCE** : le medecinName dans create_appointment doit être **identique** au medecinName "
             + "utilisé dans get_available_slots.\n"
             + "- Si plusieurs médecins correspondent, présente-les tous et demande au patient de choisir.\n"
             + "- Une seule question à la fois\n"
             + "- Confirme tous les détails du RDV avant de créer\n"
             + "- Résume le RDV après création avec les données retournées par create_appointment\n"
             + "- Sois empathique, clair et professionnel\n"
             + "- Réponds dans la même langue que le patient (français par défaut)\n\n"
             + "## Date du jour : " + today;
    }

    private boolean isAnonymous(Authentication auth) {
        return auth == null || !auth.isAuthenticated() || ANONYMOUS.equals(auth.getName());
    }

    private boolean hasRole(Authentication auth, String role) {
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(role));
    }

    /**
     * Resolves a doctor by the name string the LLM provides (e.g. "Dr. Benbakka Youness").
     * Strips the "Dr." / "Dr " prefix, then searches with the remaining term.
     * Falls back to a full-list scan if the search API returns no results.
     */
    private MedecinResponse resolveDoctor(String rawName) {
        if (rawName == null || rawName.isBlank()) return null;
        String clean = rawName.replaceAll("(?i)^dr\\.?\\s*", "").trim();

        // 1. Try the service's own search (searches nom + prénom + spécialité)
        List<MedecinResponse> hits = medecinService.getAll(clean, PageRequest.of(0, 50)).getContent();
        if (!hits.isEmpty()) return hits.get(0);

        // 2. Fallback: full-list scan with partial matching
        return medecinService.getAll(null, PageRequest.of(0, 500)).getContent().stream()
                .filter(m -> {
                    String full    = (m.getPrenom() + " " + m.getNom()).toLowerCase();
                    String reverse = (m.getNom() + " " + m.getPrenom()).toLowerCase();
                    String term    = clean.toLowerCase();
                    return full.contains(term) || reverse.contains(term)
                           || term.contains(m.getNom().toLowerCase())
                           || term.contains(m.getPrenom().toLowerCase());
                })
                .findFirst()
                .orElse(null);
    }

    private Long toLong(Object value) {
        if (value instanceof Number n) return n.longValue();
        if (value instanceof String s) return Long.parseLong(s);
        throw new IllegalArgumentException("Cannot convert to Long: " + value);
    }

    private String jsonError(String message) {
        return "{\"erreur\":\"" + message.replace("\"", "'") + "\"}";
    }
}
