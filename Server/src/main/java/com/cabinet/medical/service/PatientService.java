package com.cabinet.medical.service;

import com.cabinet.medical.dto.request.PatientRequest;
import com.cabinet.medical.dto.response.PatientResponse;
import com.cabinet.medical.entity.Patient;
import com.cabinet.medical.entity.User;
import com.cabinet.medical.enums.Role;
import com.cabinet.medical.exception.ResourceNotFoundException;
import com.cabinet.medical.mapper.PatientMapper;
import com.cabinet.medical.repository.PatientRepository;
import com.cabinet.medical.repository.UserRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
        return patientMapper.toResponse(findOrThrow(id));
    }

    @Transactional
    public PatientResponse create(PatientRequest request) {
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
            .build();
        if (StringUtils.hasText(request.getEmail()) && StringUtils.hasText(request.getPassword())) {
            User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.PATIENT)
                .enabled(true)
                .build();
            userRepository.save(user);
            patient.setUser(user);
        }
        return patientMapper.toResponse(patientRepository.save(patient));
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
