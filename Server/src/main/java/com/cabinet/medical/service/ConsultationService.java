package com.cabinet.medical.service;

import com.cabinet.medical.dto.request.ConsultationRequest;
import com.cabinet.medical.dto.response.ConsultationResponse;
import com.cabinet.medical.entity.Consultation;
import com.cabinet.medical.entity.Medecin;
import com.cabinet.medical.entity.Patient;
import com.cabinet.medical.entity.RendezVous;
import com.cabinet.medical.entity.User;
import com.cabinet.medical.exception.ResourceNotFoundException;
import com.cabinet.medical.mapper.ConsultationMapper;
import com.cabinet.medical.messaging.producer.AuditEventProducer;
import com.cabinet.medical.repository.ConsultationRepository;
import com.cabinet.medical.repository.MedecinRepository;
import com.cabinet.medical.repository.PatientRepository;
import com.cabinet.medical.repository.RendezVousRepository;
import com.cabinet.medical.repository.UserRepository;
import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ConsultationService {

    private final ConsultationRepository consultationRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final RendezVousRepository rendezVousRepository;
    private final UserRepository userRepository;
    private final ConsultationMapper consultationMapper;
    private final AuditEventProducer auditEventProducer;

    @CircuitBreaker(name = "consultationService", fallbackMethod = "consultationFallback")
    @Bulkhead(name = "consultationService")
    public Page<ConsultationResponse> getAll(Pageable pageable) {
        return consultationRepository.findAll(pageable).map(consultationMapper::toResponse);
    }

    public Page<ConsultationResponse> consultationFallback(Pageable pageable, Exception ex) {
        return Page.empty();
    }

    public ConsultationResponse getById(Long id) {
        return consultationMapper.toResponse(findOrThrow(id));
    }

    @Transactional
    public ConsultationResponse create(ConsultationRequest request) {
        Patient patient = patientRepository.findById(request.getPatientId())
            .orElseThrow(() -> new ResourceNotFoundException("Patient non trouvé"));
        Medecin medecin = medecinRepository.findById(request.getMedecinId())
            .orElseThrow(() -> new ResourceNotFoundException("Médecin non trouvé"));
        RendezVous rdv = null;
        if (request.getRendezVousId() != null) {
            rdv = rendezVousRepository.findById(request.getRendezVousId()).orElse(null);
        }
        Consultation consultation = Consultation.builder()
            .dateVisite(request.getDateVisite())
            .motif(request.getMotif())
            .diagnostic(request.getDiagnostic())
            .diagnosticPatient(request.getDiagnosticPatient())
            .notes(request.getNotes())
            .actesRealises(request.getActesRealises())
            .montantTotal(request.getMontantTotal())
            .patient(patient)
            .medecin(medecin)
            .rendezVous(rdv)
            .build();
        Consultation saved = consultationRepository.save(consultation);
        auditEventProducer.publierEvenementAudit("CREATE", "Consultation", saved.getId());
        return consultationMapper.toResponse(saved);
    }

    @Transactional
    public ConsultationResponse update(Long id, ConsultationRequest request) {
        Consultation c = findOrThrow(id);
        c.setDateVisite(request.getDateVisite());
        c.setMotif(request.getMotif());
        c.setDiagnostic(request.getDiagnostic());
        c.setDiagnosticPatient(request.getDiagnosticPatient());
        c.setNotes(request.getNotes());
        c.setActesRealises(request.getActesRealises());
        c.setMontantTotal(request.getMontantTotal());
        return consultationMapper.toResponse(consultationRepository.save(c));
    }

    public Page<ConsultationResponse> getByPatient(Long patientId, Pageable pageable) {
        return consultationRepository.findByPatientId(patientId, pageable).map(consultationMapper::toResponse);
    }

    public Page<ConsultationResponse> getByMedecin(Long medecinId, Pageable pageable) {
        return consultationRepository.findByMedecinId(medecinId, pageable).map(consultationMapper::toResponse);
    }

    /**
     * Returns a consultation with fields filtered according to the caller's role:
     *  - ADMIN / MEDECIN : all fields
     *  - SECRETAIRE      : motif, actes, montant — no diagnostic/notes/diagnosticPatient
     *  - PATIENT         : motif, actes, montant, diagnosticPatient — no diagnostic/notes
     *                      + ownership is verified
     */
    @Transactional(readOnly = true)
    public ConsultationResponse getByIdForRole(Long id, Authentication auth) {
        Consultation consultation = findOrThrow(id);
        String role = auth.getAuthorities().iterator().next().getAuthority();

        if ("ROLE_PATIENT".equals(role)) {
            String patientEmail = consultation.getPatient().getUser().getEmail();
            if (!patientEmail.equals(auth.getName())) {
                throw new AccessDeniedException("Vous n'êtes pas autorisé à accéder à cette consultation.");
            }
        }

        ConsultationResponse response = consultationMapper.toResponse(consultation);

        switch (role) {
            case "ROLE_SECRETAIRE":
                response.setDiagnostic(null);
                response.setDiagnosticPatient(null);
                response.setNotes(null);
                break;
            case "ROLE_PATIENT":
                response.setDiagnostic(null);
                response.setNotes(null);
                break;
            default:
                // ROLE_ADMIN, ROLE_MEDECIN — all fields kept
                break;
        }
        return response;
    }

    /**
     * Returns all consultations recorded by the authenticated médecin (MEDECIN/me).
     */
    public Page<ConsultationResponse> getByMedecinEmail(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé: " + email));
        Medecin medecin = medecinRepository.findByUserId(user.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Profil médecin introuvable pour: " + email));
        return consultationRepository.findByMedecinId(medecin.getId(), pageable)
            .map(consultationMapper::toResponse);
    }

    private Consultation findOrThrow(Long id) {
        return consultationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Consultation non trouvée avec l'id: " + id));
    }
}
