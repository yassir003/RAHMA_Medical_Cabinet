package com.cabinet.medical.service;

import com.cabinet.medical.dto.request.PatientRequest;
import com.cabinet.medical.dto.response.PatientResponse;
import com.cabinet.medical.entity.Patient;
import com.cabinet.medical.entity.User;
import com.cabinet.medical.enums.Role;
import com.cabinet.medical.exception.RegistrationException;
import com.cabinet.medical.exception.ResourceNotFoundException;
import com.cabinet.medical.mapper.PatientMapper;
import com.cabinet.medical.messaging.producer.NotificationProducer;
import com.cabinet.medical.repository.PatientRepository;
import com.cabinet.medical.repository.UserRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final PatientMapper patientMapper;
    private final PasswordEncoder passwordEncoder;
    private final NotificationProducer notificationProducer;

    @CircuitBreaker(name = "patientService", fallbackMethod = "patientsFallback")
    @Retry(name = "patientService")
    public Page<PatientResponse> getAllPatients(String search, Pageable pageable) {
        if (StringUtils.hasText(search)) {
            return patientRepository
                .findByNomContainingOrPrenomContainingOrCinContaining(search, search, search, pageable)
                .map(patientMapper::toResponse);
        }
        return patientRepository.findAll(pageable).map(patientMapper::toResponse);
    }

    public Page<PatientResponse> patientsFallback(String search, Pageable pageable, Exception ex) {
        return Page.empty();
    }

    public PatientResponse getById(Long id) {
        Patient patient = findOrThrow(id);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PATIENT"))) {
            Patient mine = patientRepository.findByUser_Email(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Fiche patient introuvable pour ce compte"));
            if (!mine.getId().equals(id)) {
                throw new AccessDeniedException("Accès refusé : vous ne pouvez consulter que votre propre fiche");
            }
        }
        return patientMapper.toResponse(patient);
    }

    @Transactional
    public PatientResponse create(PatientRequest request) {
        if (!StringUtils.hasText(request.getEmail())) {
            throw new RegistrationException("L'email du patient est obligatoire");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RegistrationException("Un compte existe déjà avec l'email : " + request.getEmail());
        }
        if (patientRepository.findByCin(request.getCin()).isPresent()) {
            throw new RegistrationException("Un patient existe déjà avec le CIN : " + request.getCin());
        }

        // Mot de passe temporaire = CIN (le patient devra le changer à la première connexion)
        User user = User.builder()
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getCin()))
            .role(Role.PATIENT)
            .enabled(true)
            .passwordChanged(false)
            .build();
        userRepository.save(user);

        Patient patient = Patient.builder()
            .nom(request.getNom())
            .prenom(request.getPrenom())
            .cin(request.getCin())
            .dateNaissance(request.getDateNaissance())
            .telephone(request.getTelephone())
            .adresse(request.getAdresse())
            .groupeSanguin(request.getGroupeSanguin())
            .allergies(request.getAllergies())
            .antecedents(request.getAntecedents())
            .user(user)
            .build();
        Patient saved = patientRepository.save(patient);

        // Notification JMS avec les identifiants provisoires
        notificationProducer.envoyerNotification(saved,
            "Votre compte a été créé. Email : " + request.getEmail()
            + ", Mot de passe temporaire : votre CIN (" + request.getCin() + ")."
            + " Connectez-vous et changez votre mot de passe.");

        return patientMapper.toResponse(saved);
    }

    @Transactional
    public PatientResponse update(Long id, PatientRequest request) {
        Patient patient = findOrThrow(id);
        patient.setNom(request.getNom());
        patient.setPrenom(request.getPrenom());
        patient.setCin(request.getCin());
        patient.setDateNaissance(request.getDateNaissance());
        patient.setTelephone(request.getTelephone());
        patient.setAdresse(request.getAdresse());
        patient.setGroupeSanguin(request.getGroupeSanguin());
        patient.setAllergies(request.getAllergies());
        patient.setAntecedents(request.getAntecedents());
        return patientMapper.toResponse(patientRepository.save(patient));
    }

    @Transactional
    public void delete(Long id) {
        findOrThrow(id);
        patientRepository.deleteById(id);
    }

    private Patient findOrThrow(Long id) {
        return patientRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Patient non trouvé avec l'id: " + id));
    }
}
