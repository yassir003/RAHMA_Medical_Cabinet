package com.cabinet.medical.service;

import com.cabinet.medical.dto.request.ChangePasswordRequest;
import com.cabinet.medical.dto.request.LoginRequest;
import com.cabinet.medical.dto.request.RegisterRequest;
import com.cabinet.medical.dto.response.AuthResponse;
import com.cabinet.medical.entity.Patient;
import com.cabinet.medical.entity.User;
import com.cabinet.medical.enums.Role;
import com.cabinet.medical.exception.RegistrationException;
import com.cabinet.medical.exception.ResourceNotFoundException;
import com.cabinet.medical.messaging.producer.AuditEventProducer;
import com.cabinet.medical.repository.PatientRepository;
import com.cabinet.medical.repository.UserRepository;
import com.cabinet.medical.security.JwtTokenProvider;
import com.cabinet.medical.dto.response.PageItem;
import lombok.RequiredArgsConstructor;
import java.util.List;
import java.util.ArrayList;
import java.util.Arrays;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditEventProducer auditEventProducer;

    public AuthResponse login(LoginRequest request) {
        // Check user existence first so we can return a clear 404 instead of a generic error
        if (!userRepository.existsByEmail(request.getEmail())) {
            throw new ResourceNotFoundException(
                "Aucun compte trouvé pour cet email. Veuillez créer un compte d'abord.");
        }
        Authentication auth = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        UserDetails userDetails = (UserDetails) auth.getPrincipal();
        String token = jwtTokenProvider.generateToken(userDetails);
        String role = userDetails.getAuthorities().stream()
            .findFirst().map(a -> a.getAuthority().replace("ROLE_", "")).orElse("");
        boolean pwChanged = (userDetails instanceof User u) && u.isPasswordChanged();
        return AuthResponse.builder()
            .token(token)
            .type("Bearer")
            .email(userDetails.getUsername())
            .role(role)
            .passwordChanged(pwChanged)
            .pages(getPagesForRole(role))
            .build();
    }

    private List<PageItem> getPagesForRole(String role) {
        List<PageItem> base = Arrays.asList(
            new PageItem("Dashboard", "/dashboard"),
            new PageItem("Appointment", "/dashboard/appointments")
        );

        List<PageItem> pages = new ArrayList<>(base);

        switch (role) {
            case "ADMIN":
                pages.addAll(Arrays.asList(
                    new PageItem("Medical Report", "/dashboard/reports"),
                    new PageItem("Patient", "/dashboard/patients"),
                    new PageItem("Doctors list", "/dashboard/doctors/list"),
                    new PageItem("Secretary list", "/dashboard/secretary/list"),
                    new PageItem("Log", "/dashboard/logs")
                ));
                break;
            case "MEDECIN":
                pages = new ArrayList<>(Arrays.asList(
                    new PageItem("Workspace", "/dashboard/doctors"),
                    new PageItem("Appointment", "/dashboard/appointments"),
                    new PageItem("Medical Report", "/dashboard/reports"),
                    new PageItem("Patient", "/dashboard/doctors/patients"),
                    new PageItem("Message", "/dashboard/messages"),
                    new PageItem("Setting", "/dashboard/settings")
                ));
                break;
            case "SECRETAIRE":
                pages = new ArrayList<>(Arrays.asList(
                    new PageItem("Workspace", "/dashboard/secretary"),
                    new PageItem("Appointment", "/dashboard/appointments"),
                    new PageItem("Patient", "/dashboard/patients"),
                    new PageItem("Mutuals", "/dashboard/mutuals"),
                    new PageItem("Message", "/dashboard/messages"),
                    new PageItem("Setting", "/dashboard/settings")
                ));
                break;
            case "PATIENT":
                pages = new ArrayList<>(Arrays.asList(
                    new PageItem("Accueil", "/dashboard/patient"),
                    new PageItem("Rendez-vous", "/dashboard/patient/appointments"),
                    new PageItem("Suivi Médical", "/dashboard/patient/medical"),
                    new PageItem("Notifications", "/dashboard/patient/notifications"),
                    new PageItem("Assistant IA", "/dashboard/patient/chat")
                ));
                break;
            default:
                break;
        }
        return pages;
    }


    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // 1. Vérifier unicité email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RegistrationException("Un compte existe déjà avec l'email : " + request.getEmail());
        }

        // 2. Vérifier unicité CIN
        if (patientRepository.findByCin(request.getCin()).isPresent()) {
            throw new RegistrationException("Un patient existe déjà avec le CIN : " + request.getCin());
        }

        // 3. Créer le compte User (role PATIENT, password bcrypt)
        User user = User.builder()
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .role(Role.PATIENT)
            .enabled(true)
            .build();
        user = userRepository.save(user);

        // 4. Créer le Patient lié à ce User
        Patient patient = Patient.builder()
            .nom(request.getNom())
            .prenom(request.getPrenom())
            .cin(request.getCin())
            .dateNaissance(request.getDateNaissance())
            .telephone(request.getTelephone())
            .adresse(request.getAdresse())
            .user(user)
            .build();
        patient = patientRepository.save(patient);

        // 5. Audit
        auditEventProducer.publierEvenementAudit("REGISTER", "Patient", patient.getId());

        // 6. Générer le JWT et retourner AuthResponse
        String token = jwtTokenProvider.generateToken(user);
        return AuthResponse.builder()
            .token(token)
            .type("Bearer")
            .email(user.getEmail())
            .role("PATIENT")
            .pages(getPagesForRole("PATIENT"))
            .build();
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        if (!passwordEncoder.matches(request.getAncienMotDePasse(), user.getPassword())) {
            throw new RegistrationException("Ancien mot de passe incorrect");
        }
        user.setPassword(passwordEncoder.encode(request.getNouveauMotDePasse()));
        user.setPasswordChanged(true);
        userRepository.save(user);
        auditEventProducer.publierEvenementAudit("CHANGE_PASSWORD", "User", user.getId());
    }
}
