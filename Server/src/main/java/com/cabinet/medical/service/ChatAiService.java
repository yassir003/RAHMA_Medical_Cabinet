package com.cabinet.medical.service;

import com.cabinet.medical.dto.request.ChatRequest.Message;
import com.cabinet.medical.dto.request.RegisterRequest;
import com.cabinet.medical.dto.request.RendezVousRequest;
import com.cabinet.medical.dto.response.ConsultationResponse;
import com.cabinet.medical.dto.response.MedecinResponse;
import com.cabinet.medical.dto.response.PatientResponse;
import com.cabinet.medical.dto.response.RendezVousResponse;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.lang.Nullable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@Slf4j
public class ChatAiService {

    private static final String ANONYMOUS = "anonymousUser";

    @Value("${spring.ai.openai.api-key:}")
    private String apiKey;

    private final ObjectProvider<ChatClient.Builder> chatClientBuilderProvider;
    private final MedecinService medecinService;
    private final RendezVousService rendezVousService;
    private final PatientService patientService;
    private final ConsultationService consultationService;
    private final AuthService authService;

    public ChatAiService(
            ObjectProvider<ChatClient.Builder> chatClientBuilderProvider,
            MedecinService medecinService,
            RendezVousService rendezVousService,
            PatientService patientService,
            ConsultationService consultationService,
            AuthService authService) {
        this.chatClientBuilderProvider = chatClientBuilderProvider;
        this.medecinService = medecinService;
        this.rendezVousService = rendezVousService;
        this.patientService = patientService;
        this.consultationService = consultationService;
        this.authService = authService;
    }

    @CircuitBreaker(name = "aiService", fallbackMethod = "aiFallback")
    public String chat(List<Message> history, Authentication auth) {
        if (apiKey == null || apiKey.isBlank()) {
            return "L'assistant IA n'est pas configure. "
                + "Veuillez definir `spring.ai.openai.api-key` dans application.properties.";
        }

        ChatClient.Builder builder = chatClientBuilderProvider == null
            ? null
            : chatClientBuilderProvider.getIfAvailable();
        if (builder == null) {
            return "L'assistant IA n'est pas configure. "
                + "Veuillez verifier la dependance Spring AI OpenAI et la configuration du modele.";
        }

        String response = builder.build()
            .prompt()
            .system(buildSystemPrompt(auth))
            .messages(toSpringAiMessages(history))
            .tools(new MedicalCabinetTools(auth))
            .call()
            .content();

        return response == null || response.isBlank()
            ? "Desole, je n'ai pas pu traiter votre demande."
            : response;
    }

    public String aiFallback(List<Message> history, Authentication auth, Exception ex) {
        log.warn("[ChatAiService] AI service unavailable: {}", ex.getMessage());
        return "L'assistant IA est temporairement indisponible. Veuillez reessayer.";
    }

    private List<org.springframework.ai.chat.messages.Message> toSpringAiMessages(List<Message> history) {
        List<org.springframework.ai.chat.messages.Message> messages = new ArrayList<>();
        if (history == null) {
            return messages;
        }

        for (Message dto : history) {
            if (dto == null || dto.getContent() == null || dto.getContent().isBlank()) {
                continue;
            }
            String role = dto.getRole() == null ? "user" : dto.getRole().trim().toLowerCase(Locale.ROOT);
            switch (role) {
                case "assistant" -> messages.add(new AssistantMessage(dto.getContent()));
                case "system" -> messages.add(new SystemMessage(dto.getContent()));
                default -> messages.add(new UserMessage(dto.getContent()));
            }
        }
        return messages;
    }

    private String buildSystemPrompt(Authentication auth) {
        String today = LocalDate.now()
            .format(DateTimeFormatter.ofPattern("EEEE d MMMM yyyy", Locale.FRENCH));
        return "Tu es Rahma Assistant, un assistant medical IA chaleureux et professionnel "
            + "du Cabinet Medical Rahma.\n\n"
            + buildAuthenticationContext(auth)
            + "\n\n"
            + "## Ton role\nTu aides les patients a :\n"
            + "- Prendre un rendez-vous en les guidant pas a pas\n"
            + "- Consulter leurs rendez-vous, historique et prochains RDV\n"
            + "- Suivre leur parcours medical, consultations passees\n"
            + "- Connaitre nos medecins, specialites, disponibilites\n\n"
            + "## Flux 1 - Prise de RDV (patient connecte) :\n"
            + "1. Medecin souhaite -> get_doctors, presente les resultats\n"
            + "2. Date souhaitee (future)\n"
            + "3. Creneaux -> get_available_slots(medecinName='Dr. Prenom Nom', date='YYYY-MM-DD')\n"
            + "4. Motif -> confirmer -> create_appointment\n\n"
            + "## Flux 2 - Prise de RDV (patient NON connecte) :\n"
            + "Si le patient n'est pas connecte et souhaite un rendez-vous, guide-le ainsi :\n"
            + "1. Informe-le qu'il faut un compte et propose de l'inscrire maintenant.\n"
            + "2. Collecte UNE information a la fois dans cet ordre : nom, prenom, CIN, email, "
            + "mot de passe (minimum 8 caracteres), telephone optionnel.\n"
            + "3. Appelle register_patient avec les informations collectees.\n"
            + "4. Si register_patient reussit, enchaine avec le flux RDV et passe patientEmail "
            + "dans create_appointment.\n\n"
            + "## Regles critiques :\n"
            + "- Ne demande jamais au patient s'il est connecte : l'etat de connexion est fourni "
            + "dans le contexte d'authentification ci-dessus.\n"
            + "- Si le contexte indique PATIENT_CONNECTE, continue directement le flux de rendez-vous "
            + "sans proposer de connexion ni creation de compte.\n"
            + "- Si le contexte indique NON_CONNECTE, explique qu'un compte est necessaire avant "
            + "la creation du rendez-vous et propose l'inscription.\n"
            + "- N'utilise jamais d'identifiant numerique. Utilise le nom exact du medecin "
            + "(ex: 'Dr. Benbakka Youness') pour get_available_slots et create_appointment.\n"
            + "- Le medecinName dans create_appointment doit etre identique a celui utilise "
            + "dans get_available_slots.\n"
            + "- Si plusieurs medecins correspondent, presente-les tous et demande au patient de choisir.\n"
            + "- Une seule question a la fois.\n"
            + "- Confirme tous les details du RDV avant de creer.\n"
            + "- Resume le RDV apres creation avec les donnees retournees par create_appointment.\n"
            + "- Sois empathique, clair et professionnel.\n"
            + "- Reponds dans la meme langue que le patient (francais par defaut).\n\n"
            + "## Date du jour : " + today;
    }

    private String buildAuthenticationContext(Authentication auth) {
        if (isAnonymous(auth)) {
            return "## Contexte d'authentification\n"
                + "Etat: NON_CONNECTE\n"
                + "Le visiteur n'est pas connecte.";
        }

        String roles = auth.getAuthorities().stream()
            .map(authority -> authority.getAuthority())
            .sorted()
            .toList()
            .toString();

        if (hasRole(auth, "ROLE_PATIENT")) {
            return "## Contexte d'authentification\n"
                + "Etat: PATIENT_CONNECTE\n"
                + "Email patient: " + auth.getName() + "\n"
                + "Roles: " + roles;
        }

        return "## Contexte d'authentification\n"
            + "Etat: CONNECTE_NON_PATIENT\n"
            + "Utilisateur: " + auth.getName() + "\n"
            + "Roles: " + roles + "\n"
            + "La creation de rendez-vous par le chatbot est reservee aux patients.";
    }

    private boolean isAnonymous(Authentication auth) {
        return auth == null || !auth.isAuthenticated() || ANONYMOUS.equals(auth.getName());
    }

    private boolean hasRole(Authentication auth, String role) {
        return auth != null && auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals(role));
    }

    private MedecinResponse resolveExactDoctor(String rawName) {
        if (rawName == null || rawName.isBlank()) {
            return null;
        }

        return medecinService.getAll(null, PageRequest.of(0, 500)).getContent().stream()
            .filter(m -> doctorNameMatchesExactly(m, rawName))
            .findFirst()
            .orElse(null);
    }

    private boolean doctorNameMatchesExactly(MedecinResponse medecin, String rawName) {
        String requested = normalizeDoctorName(rawName);
        String full = normalizeDoctorName(medecin.getPrenom() + " " + medecin.getNom());
        String reverse = normalizeDoctorName(medecin.getNom() + " " + medecin.getPrenom());
        String label = normalizeDoctorName(doctorLabel(medecin));
        return requested.equals(full) || requested.equals(reverse) || requested.equals(label);
    }

    private String doctorLabel(MedecinResponse medecin) {
        return "Dr. " + medecin.getPrenom() + " " + medecin.getNom();
    }

    private String normalizeDoctorName(String value) {
        String withoutTitle = value == null ? "" : value.replaceAll("(?i)^dr\\.?\\s*", "");
        String withoutAccents = Normalizer.normalize(withoutTitle, Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "");
        return withoutAccents.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
    }

    private Map<String, Object> error(String message) {
        return Map.of("erreur", message);
    }

    public class MedicalCabinetTools {

        private final Authentication auth;

        MedicalCabinetTools(Authentication auth) {
            this.auth = auth;
        }

        @Tool(name = "get_doctors", description = "Recupere la liste des medecins du cabinet avec leurs specialites. Utilise cet outil pour aider le patient a choisir un medecin.")
        public Object getDoctors(
                @ToolParam(description = "Terme de recherche optionnel: nom, prenom ou specialite", required = false)
                @Nullable String search) {
            Page<MedecinResponse> page = medecinService.getAll(search, PageRequest.of(0, 50));
            if (page.isEmpty()) {
                return "Aucun medecin trouve.";
            }

            return page.getContent().stream().map(m -> {
                Map<String, Object> doc = new LinkedHashMap<>();
                doc.put("nom", doctorLabel(m));
                doc.put("specialite", m.getSpecialite());
                doc.put("telephone", m.getTelephone() != null ? m.getTelephone() : "-");
                return doc;
            }).toList();
        }

        @Tool(name = "get_available_slots", description = "Recupere les creneaux disponibles pour un medecin a une date donnee. Utilise le nom exact retourne par get_doctors, par exemple 'Dr. Benbakka Youness'.")
        public Object getAvailableSlots(
                @ToolParam(description = "Nom complet du medecin tel que retourne par get_doctors, ex: 'Dr. Benbakka Youness'")
                String medecinName,
                @ToolParam(description = "Date au format YYYY-MM-DD")
                String date) {
            MedecinResponse doc = resolveExactDoctor(medecinName);
            if (doc == null) {
                return "Medecin introuvable pour le nom : \"" + medecinName
                    + "\". Appelez d'abord get_doctors et utilisez exactement le nom retourne.";
            }

            LocalDate requestedDate = LocalDate.parse(date);
            String selectedDoctor = doctorLabel(doc);
            List<String> slots = rendezVousService.getDisponibilites(doc.getId(), requestedDate);
            if (slots.isEmpty()) {
                return "Aucun creneau disponible le " + requestedDate + " pour "
                    + selectedDoctor + ". Essayez une autre date.";
            }

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("medecin", selectedDoctor);
            result.put("medecinName", selectedDoctor);
            result.put("date", requestedDate.toString());
            result.put("creneaux", slots);
            return result;
        }

        @Tool(name = "register_patient", description = "Inscrit un nouveau patient sur la plateforme apres collecte des informations obligatoires. Retourne patientEmail a passer ensuite a create_appointment.")
        public Object registerPatient(
                @ToolParam(description = "Nom de famille") String nom,
                @ToolParam(description = "Prenom") String prenom,
                @ToolParam(description = "Numero CIN, carte d'identite nationale") String cin,
                @ToolParam(description = "Adresse email") String email,
                @ToolParam(description = "Mot de passe, minimum 8 caracteres") String password,
                @ToolParam(description = "Numero de telephone optionnel", required = false) @Nullable String telephone,
                @ToolParam(description = "Adresse postale optionnelle", required = false) @Nullable String adresse,
                @ToolParam(description = "Date de naissance YYYY-MM-DD optionnelle", required = false) @Nullable String dateNaissance) {
            RegisterRequest req = new RegisterRequest();
            req.setNom(nom);
            req.setPrenom(prenom);
            req.setCin(cin);
            req.setEmail(email);
            req.setPassword(password);
            req.setTelephone(telephone);
            req.setAdresse(adresse);
            if (dateNaissance != null && !dateNaissance.isBlank()) {
                req.setDateNaissance(LocalDate.parse(dateNaissance));
            }

            try {
                authService.register(req);
            } catch (Exception e) {
                return error("Inscription echouee : " + e.getMessage());
            }

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("success", true);
            result.put("message", "Compte cree avec succes !");
            result.put("patientEmail", req.getEmail());
            result.put("info", "Transmets patientEmail=" + req.getEmail()
                + " a create_appointment pour finaliser le rendez-vous.");
            return result;
        }

        @Tool(name = "create_appointment", description = "Cree un rendez-vous apres confirmation du patient. Utilise exactement le meme medecinName que get_available_slots. Pour un patient venant de s'inscrire, passe patientEmail retourne par register_patient.")
        public Object createAppointment(
                @ToolParam(description = "Nom exact du medecin, identique a celui utilise dans get_available_slots")
                String medecinName,
                @ToolParam(description = "Date et heure ISO : YYYY-MM-DDTHH:MM:SS")
                String dateHeure,
                @ToolParam(description = "Motif de la consultation")
                String motif,
                @ToolParam(description = "Notes optionnelles", required = false) @Nullable String notes,
                @ToolParam(description = "Email du patient nouvellement inscrit, uniquement apres register_patient", required = false)
                @Nullable String patientEmail) {
            MedecinResponse doc = resolveExactDoctor(medecinName);
            if (doc == null) {
                return "Je ne peux pas creer ce rendez-vous car le medecin \"" + medecinName
                    + "\" ne correspond pas exactement a un medecin du cabinet. "
                    + "Appelez get_doctors et demandez au patient de confirmer le nom exact.";
            }

            PatientResponse patient;
            if (!isAnonymous(auth)) {
                if (!hasRole(auth, "ROLE_PATIENT")) {
                    return "Cette fonctionnalite est reservee aux patients.";
                }
                patient = patientService.getMe(auth.getName());
            } else if (patientEmail != null && !patientEmail.isBlank()) {
                try {
                    patient = patientService.getMe(patientEmail);
                } catch (Exception e) {
                    return "Impossible de trouver le patient pour l'email : " + patientEmail
                        + ". Veuillez d'abord vous inscrire via register_patient.";
                }
            } else {
                return "Vous devez etre connecte ou vous inscrire pour creer un rendez-vous. "
                    + "Appelez register_patient pour creer un compte.";
            }

            RendezVousRequest req = new RendezVousRequest();
            req.setPatientId(patient.getId());
            req.setMedecinId(doc.getId());
            req.setDateHeure(LocalDateTime.parse(dateHeure));
            req.setMotif(motif);
            req.setNotes(notes);

            RendezVousResponse rdv = rendezVousService.creerRendezVous(req);

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("success", true);
            result.put("message", "Rendez-vous cree avec succes !");
            result.put("id", rdv.getId());
            result.put("dateHeure", rdv.getDateHeure() != null ? rdv.getDateHeure().toString() : null);
            result.put("medecin", "Dr. " + rdv.getMedecinPrenom() + " " + rdv.getMedecinNom());
            result.put("medecinNameConfirme", doctorLabel(doc));
            result.put("motif", rdv.getMotif());
            result.put("statut", rdv.getStatut() != null ? rdv.getStatut().name() : null);
            return result;
        }

        @Tool(name = "get_my_appointments", description = "Recupere les rendez-vous du patient connecte.")
        public Object getMyAppointments() {
            if (isAnonymous(auth)) {
                return "Le patient doit etre connecte pour consulter ses rendez-vous.";
            }
            Page<RendezVousResponse> page = rendezVousService.getMyRdvs(
                auth.getName(),
                PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "dateHeure")));
            if (page.isEmpty()) {
                return "Vous n'avez aucun rendez-vous enregistre.";
            }
            return page.getContent().stream().map(r -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", r.getId());
                m.put("dateHeure", r.getDateHeure() != null ? r.getDateHeure().toString() : null);
                m.put("medecin", "Dr. " + r.getMedecinPrenom() + " " + r.getMedecinNom());
                m.put("specialite", r.getMedecinSpecialite());
                m.put("motif", r.getMotif());
                m.put("statut", r.getStatut() != null ? r.getStatut().name() : null);
                return m;
            }).toList();
        }

        @Tool(name = "get_my_medical_followup", description = "Recupere l'historique des consultations du patient connecte.")
        public Object getMyMedicalFollowup() {
            if (isAnonymous(auth)) {
                return "Le patient doit etre connecte pour consulter son suivi medical.";
            }
            PatientResponse patient = patientService.getMe(auth.getName());
            Page<ConsultationResponse> page =
                consultationService.getByPatient(patient.getId(), PageRequest.of(0, 20));
            if (page.isEmpty()) {
                return "Aucune consultation enregistree.";
            }
            return page.getContent().stream().map(c -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", c.getId());
                m.put("date", c.getDateVisite() != null ? c.getDateVisite().toString() : null);
                m.put("medecin", "Dr. " + c.getMedecinPrenom() + " " + c.getMedecinNom());
                m.put("motif", c.getMotif());
                m.put("diagnosticPatient", c.getDiagnosticPatient());
                m.put("actesRealises", c.getActesRealises());
                m.put("montantTotal", c.getMontantTotal());
                return m;
            }).toList();
        }
    }
}
