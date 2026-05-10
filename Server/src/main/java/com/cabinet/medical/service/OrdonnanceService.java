package com.cabinet.medical.service;

import com.cabinet.medical.dto.request.LigneMedicamentRequest;
import com.cabinet.medical.dto.request.OrdonnanceRequest;
import com.cabinet.medical.dto.response.OrdonnanceResponse;
import com.cabinet.medical.entity.Consultation;
import com.cabinet.medical.entity.LigneMedicament;
import com.cabinet.medical.entity.Ordonnance;
import com.cabinet.medical.enums.Role;
import com.cabinet.medical.enums.StatutOrdonnance;
import com.cabinet.medical.exception.ResourceNotFoundException;
import com.cabinet.medical.mapper.OrdonnanceMapper;
import com.cabinet.medical.messaging.producer.AuditEventProducer;
import com.cabinet.medical.repository.ConsultationRepository;
import com.cabinet.medical.repository.OrdonnanceRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrdonnanceService {

    private final OrdonnanceRepository ordonnanceRepository;
    private final ConsultationRepository consultationRepository;
    private final OrdonnanceMapper ordonnanceMapper;
    private final AuditEventProducer auditEventProducer;

    @Transactional
    @CircuitBreaker(name = "ordonnanceService", fallbackMethod = "createFallback")
    public OrdonnanceResponse create(OrdonnanceRequest request, String medecinEmail) {
        Consultation consultation = consultationRepository.findById(request.getConsultationId())
            .orElseThrow(() -> new ResourceNotFoundException("Consultation introuvable"));

        if (consultation.getMedecin() == null
                || consultation.getMedecin().getUser() == null
                || !consultation.getMedecin().getUser().getEmail().equals(medecinEmail)) {
            throw new AccessDeniedException("Vous ne pouvez creer une ordonnance que pour vos propres consultations");
        }

        if (ordonnanceRepository.findByConsultationId(request.getConsultationId()).isPresent()) {
            throw new IllegalStateException("Une ordonnance existe deja pour cette consultation");
        }

        Ordonnance ordonnance = Ordonnance.builder()
            .consultation(consultation)
            .medecin(consultation.getMedecin())
            .patient(consultation.getPatient())
            .dateCreation(LocalDateTime.now())
            .dureeTraitement(request.getDureeTraitement())
            .instructions(request.getInstructions())
            .statut(StatutOrdonnance.ACTIVE)
            .build();

        List<LigneMedicament> lignes = request.getMedicaments().stream()
            .map(medicament -> toEntity(medicament, ordonnance))
            .toList();
        ordonnance.setMedicaments(lignes);

        Ordonnance saved = ordonnanceRepository.save(ordonnance);
        consultation.setOrdonnance(saved);
        auditEventProducer.publierEvenementAudit("CREATE", "Ordonnance", saved.getId());

        return ordonnanceMapper.toResponse(saved);
    }

    public OrdonnanceResponse createFallback(OrdonnanceRequest request, String medecinEmail, Exception ex) {
        log.error("OrdonnanceService indisponible: {}", ex.getMessage());
        throw new RuntimeException("Service ordonnance temporairement indisponible");
    }

    @Transactional(readOnly = true)
    public OrdonnanceResponse getByIdForRole(Long id, String email, Role role) {
        Ordonnance ordonnance = findOrThrow(id);
        assertCanRead(ordonnance, email, role);
        return ordonnanceMapper.toResponse(ordonnance);
    }

    @Transactional(readOnly = true)
    public Page<OrdonnanceResponse> getForRole(String email, Role role, StatutOrdonnance statut, String search, Pageable pageable) {
        Page<Ordonnance> page = switch (role) {
            case ADMIN, SECRETAIRE -> statut == null
                ? ordonnanceRepository.findAll(pageable)
                : ordonnanceRepository.findByStatut(statut, pageable);
            case MEDECIN -> statut == null
                ? ordonnanceRepository.findByMedecinUserEmail(email, pageable)
                : ordonnanceRepository.findByMedecinUserEmailAndStatut(email, statut, pageable);
            case PATIENT -> statut == null
                ? ordonnanceRepository.findByPatientUserEmail(email, pageable)
                : ordonnanceRepository.findByPatientUserEmailAndStatut(email, statut, pageable);
        };

        if (search == null || search.isBlank()) {
            return page.map(ordonnanceMapper::toResponse);
        }

        String needle = search.trim().toLowerCase();
        List<OrdonnanceResponse> filtered = page.getContent().stream()
            .filter(ordonnance -> {
                String patientName = ordonnance.getPatient() == null
                    ? ""
                    : (safe(ordonnance.getPatient().getPrenom()) + " " + safe(ordonnance.getPatient().getNom())).toLowerCase();
                return patientName.contains(needle) || String.valueOf(ordonnance.getId()).contains(needle);
            })
            .map(ordonnanceMapper::toResponse)
            .toList();
        return new PageImpl<>(filtered, pageable, filtered.size());
    }

    @Transactional(readOnly = true)
    public Page<OrdonnanceResponse> getByPatientIdForRole(Long patientId, String email, Role role, Pageable pageable) {
        if (role == Role.PATIENT) {
            Page<Ordonnance> mine = ordonnanceRepository.findByPatientUserEmail(email, pageable);
            if (mine.getContent().stream().anyMatch(o -> !o.getPatient().getId().equals(patientId))) {
                throw new AccessDeniedException("Acces refuse");
            }
            return mine.map(ordonnanceMapper::toResponse);
        }

        if (role == Role.MEDECIN) {
            Page<Ordonnance> mine = ordonnanceRepository.findByPatientId(patientId, pageable);
            List<OrdonnanceResponse> filtered = mine.getContent().stream()
                .filter(o -> o.getMedecin().getUser().getEmail().equals(email))
                .map(ordonnanceMapper::toResponse)
                .toList();
            return new PageImpl<>(filtered, pageable, filtered.size());
        }

        return ordonnanceRepository.findByPatientId(patientId, pageable).map(ordonnanceMapper::toResponse);
    }

    @Transactional
    public OrdonnanceResponse annuler(Long id, String medecinEmail) {
        Ordonnance ordonnance = findOrThrow(id);
        if (ordonnance.getMedecin() == null
                || ordonnance.getMedecin().getUser() == null
                || !ordonnance.getMedecin().getUser().getEmail().equals(medecinEmail)) {
            throw new AccessDeniedException("Acces refuse");
        }

        ordonnance.setStatut(StatutOrdonnance.ANNULEE);
        Ordonnance saved = ordonnanceRepository.save(ordonnance);
        auditEventProducer.publierEvenementAudit("ANNULER", "Ordonnance", id);
        return ordonnanceMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public byte[] generatePdf(Long id, String email, Role role) {
        OrdonnanceResponse ordonnance = getByIdForRole(id, email, role);
        return PdfGenerator.generateOrdonnance(ordonnance);
    }

    private LigneMedicament toEntity(LigneMedicamentRequest request, Ordonnance ordonnance) {
        return LigneMedicament.builder()
            .nomMedicament(request.getNomMedicament())
            .dosage(request.getDosage())
            .frequence(request.getFrequence())
            .duree(request.getDuree())
            .instructions(request.getInstructions())
            .ordonnance(ordonnance)
            .build();
    }

    private Ordonnance findOrThrow(Long id) {
        return ordonnanceRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Ordonnance introuvable"));
    }

    private void assertCanRead(Ordonnance ordonnance, String email, Role role) {
        if (role == Role.PATIENT
                && (ordonnance.getPatient() == null
                || ordonnance.getPatient().getUser() == null
                || !ordonnance.getPatient().getUser().getEmail().equals(email))) {
            throw new AccessDeniedException("Acces refuse");
        }

        if (role == Role.MEDECIN
                && (ordonnance.getMedecin() == null
                || ordonnance.getMedecin().getUser() == null
                || !ordonnance.getMedecin().getUser().getEmail().equals(email))) {
            throw new AccessDeniedException("Acces refuse");
        }
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
