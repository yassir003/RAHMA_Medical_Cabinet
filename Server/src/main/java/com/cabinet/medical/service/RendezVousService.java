package com.cabinet.medical.service;

import com.cabinet.medical.dto.request.RendezVousRequest;
import com.cabinet.medical.dto.response.RendezVousResponse;
import com.cabinet.medical.entity.Medecin;
import com.cabinet.medical.entity.Patient;
import com.cabinet.medical.entity.RendezVous;
import com.cabinet.medical.enums.StatutRdv;
import com.cabinet.medical.exception.ConflitHoraireException;
import com.cabinet.medical.exception.ResourceNotFoundException;
import com.cabinet.medical.mapper.RendezVousMapper;
import com.cabinet.medical.messaging.producer.AuditEventProducer;
import com.cabinet.medical.messaging.producer.DashboardProducer;
import com.cabinet.medical.messaging.producer.NotificationProducer;
import com.cabinet.medical.repository.MedecinRepository;
import com.cabinet.medical.repository.PatientRepository;
import com.cabinet.medical.repository.RendezVousRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RendezVousService {

    private final RendezVousRepository rendezVousRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final RendezVousMapper rendezVousMapper;
    private final NotificationProducer notificationProducer;
    private final AuditEventProducer auditEventProducer;
    private final DashboardProducer dashboardProducer;

    @CircuitBreaker(name = "rdvService", fallbackMethod = "rdvFallback")
    @Retry(name = "rdvService")
    public Page<RendezVousResponse> getAll(Pageable pageable) {
        return rendezVousRepository.findAll(pageable).map(rendezVousMapper::toResponse);
    }

    public Page<RendezVousResponse> rdvFallback(Pageable pageable, Exception ex) {
        return Page.empty();
    }

    public RendezVousResponse getById(Long id) {
        return rendezVousMapper.toResponse(findOrThrow(id));
    }

    @Transactional
    public RendezVousResponse creerRendezVous(RendezVousRequest request) {
        boolean conflit = rendezVousRepository.existsByMedecinIdAndDateHeureBetweenAndStatutNot(
            request.getMedecinId(),
            request.getDateHeure(),
            request.getDateHeure().plusMinutes(30),
            StatutRdv.ANNULE);
        if (conflit) {
            throw new ConflitHoraireException("Le médecin a déjà un rendez-vous à cet horaire.");
        }
        Patient patient = patientRepository.findById(request.getPatientId())
            .orElseThrow(() -> new ResourceNotFoundException("Patient non trouvé"));
        Medecin medecin = medecinRepository.findById(request.getMedecinId())
            .orElseThrow(() -> new ResourceNotFoundException("Médecin non trouvé"));
        RendezVous rdv = RendezVous.builder()
            .dateHeure(request.getDateHeure())
            .motif(request.getMotif())
            .notes(request.getNotes())
            .statut(StatutRdv.PLANIFIE)
            .patient(patient)
            .medecin(medecin)
            .build();
        RendezVous saved = rendezVousRepository.save(rdv);
        notificationProducer.envoyerNotificationRdv(saved);
        auditEventProducer.publierEvenementAudit("CREATE", "RendezVous", saved.getId());
        dashboardProducer.notifierMiseAJourDashboard("NEW_RDV");
        return rendezVousMapper.toResponse(saved);
    }

    @Transactional
    public RendezVousResponse update(Long id, RendezVousRequest request) {
        RendezVous rdv = findOrThrow(id);
        rdv.setDateHeure(request.getDateHeure());
        rdv.setMotif(request.getMotif());
        rdv.setNotes(request.getNotes());
        return rendezVousMapper.toResponse(rendezVousRepository.save(rdv));
    }

    @Transactional
    public RendezVousResponse changerStatut(Long id, StatutRdv statut) {
        RendezVous rdv = findOrThrow(id);
        rdv.setStatut(statut);
        RendezVous saved = rendezVousRepository.save(rdv);
        auditEventProducer.publierEvenementAudit("UPDATE_STATUT", "RendezVous", id);
        if (statut == StatutRdv.ANNULE) {
            notificationProducer.envoyerAlerteAnnulation(saved);
        }
        return rendezVousMapper.toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        findOrThrow(id);
        rendezVousRepository.deleteById(id);
    }

    public Page<RendezVousResponse> getByPatient(Long patientId, Pageable pageable) {
        return rendezVousRepository.findByPatientId(patientId, pageable).map(rendezVousMapper::toResponse);
    }

    private RendezVous findOrThrow(Long id) {
        return rendezVousRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Rendez-vous non trouvé avec l'id: " + id));
    }
}
