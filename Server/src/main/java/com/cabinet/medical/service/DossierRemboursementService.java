package com.cabinet.medical.service;

import com.cabinet.medical.dto.request.DossierRemboursementRequest;
import com.cabinet.medical.dto.response.DossierRemboursementResponse;
import com.cabinet.medical.entity.Consultation;
import com.cabinet.medical.entity.DossierRemboursement;
import com.cabinet.medical.entity.Mutuelle;
import com.cabinet.medical.entity.Patient;
import com.cabinet.medical.enums.StatutDossier;
import com.cabinet.medical.exception.MutuelleExpireException;
import com.cabinet.medical.exception.ResourceNotFoundException;
import com.cabinet.medical.mapper.DossierRemboursementMapper;
import com.cabinet.medical.messaging.producer.AuditEventProducer;
import com.cabinet.medical.messaging.producer.NotificationProducer;
import com.cabinet.medical.repository.ConsultationRepository;
import com.cabinet.medical.repository.DossierRemboursementRepository;
import com.cabinet.medical.repository.MutuelleRepository;
import com.cabinet.medical.repository.PatientRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class DossierRemboursementService {

    private final DossierRemboursementRepository dossierRepository;
    private final PatientRepository patientRepository;
    private final MutuelleRepository mutuelleRepository;
    private final ConsultationRepository consultationRepository;
    private final DossierRemboursementMapper dossierMapper;
    private final AuditEventProducer auditEventProducer;
    private final NotificationProducer notificationProducer;

    @CircuitBreaker(name = "dossierService", fallbackMethod = "dossierFallback")
    public Page<DossierRemboursementResponse> getAll(Pageable pageable) {
        return dossierRepository.findAll(pageable).map(dossierMapper::toResponse);
    }

    public Page<DossierRemboursementResponse> dossierFallback(Pageable pageable, Exception ex) {
        return Page.empty();
    }

    public DossierRemboursementResponse getById(Long id) {
        return dossierMapper.toResponse(findOrThrow(id));
    }

    @Transactional
    public DossierRemboursementResponse createDossier(DossierRemboursementRequest request) {
        Patient patient = patientRepository.findById(request.getPatientId())
            .orElseThrow(() -> new ResourceNotFoundException("Patient non trouvé"));
        Mutuelle mutuelle = mutuelleRepository.findById(request.getMutuelleId())
            .orElseThrow(() -> new ResourceNotFoundException("Mutuelle non trouvée"));
        Consultation consultation = consultationRepository.findById(request.getConsultationId())
            .orElseThrow(() -> new ResourceNotFoundException("Consultation non trouvée"));
        if (mutuelle.getDateFin() != null && mutuelle.getDateFin().isBefore(LocalDate.now())) {
            throw new MutuelleExpireException("La mutuelle du patient est expirée.");
        }
        BigDecimal montantRembourse = BigDecimal.ZERO;
        if (consultation.getMontantTotal() != null && mutuelle.getTauxRemboursement() != null) {
            montantRembourse = consultation.getMontantTotal()
                .multiply(BigDecimal.valueOf(mutuelle.getTauxRemboursement()))
                .divide(BigDecimal.valueOf(100));
        }
        DossierRemboursement dossier = DossierRemboursement.builder()
            .montantTotal(consultation.getMontantTotal())
            .montantRembourse(montantRembourse)
            .dateCreation(LocalDateTime.now())
            .statut(StatutDossier.EN_ATTENTE)
            .patient(patient)
            .mutuelle(mutuelle)
            .consultation(consultation)
            .documentJustificatif(request.getDocumentJustificatif())
            .build();
        DossierRemboursement saved = dossierRepository.save(dossier);
        auditEventProducer.publierEvenementAudit("CREATE", "DossierRemboursement", saved.getId());
        return dossierMapper.toResponse(saved);
    }

    @Transactional
    public DossierRemboursementResponse changerStatut(Long id, StatutDossier statut) {
        DossierRemboursement dossier = findOrThrow(id);
        dossier.setStatut(statut);
        if (statut == StatutDossier.ENVOYE) {
            dossier.setDateEnvoi(LocalDateTime.now());
        }
        DossierRemboursement saved = dossierRepository.save(dossier);
        auditEventProducer.publierEvenementAudit("UPDATE_STATUT", "DossierRemboursement", id);
        notificationProducer.envoyerNotification(saved.getPatient(), "Votre dossier est " + statut.name());
        return dossierMapper.toResponse(saved);
    }

    public Page<DossierRemboursementResponse> getByPatient(Long patientId, Pageable pageable) {
        return dossierRepository.findByPatientId(patientId, pageable).map(dossierMapper::toResponse);
    }

    public Page<DossierRemboursementResponse> getByStatut(StatutDossier statut, Pageable pageable) {
        return dossierRepository.findByStatut(statut, pageable).map(dossierMapper::toResponse);
    }

    private DossierRemboursement findOrThrow(Long id) {
        return dossierRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Dossier non trouvé avec l'id: " + id));
    }
}
