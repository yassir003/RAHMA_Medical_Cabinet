package com.cabinet.medical.service;

import com.cabinet.medical.dto.request.RendezVousRequest;
import com.cabinet.medical.dto.response.RendezVousResponse;
import com.cabinet.medical.entity.Medecin;
import com.cabinet.medical.entity.Patient;
import com.cabinet.medical.entity.RendezVous;
import com.cabinet.medical.entity.User;
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
import com.cabinet.medical.repository.UserRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RendezVousService {

    private final RendezVousRepository rendezVousRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final UserRepository userRepository;
    private final RendezVousMapper rendezVousMapper;
    private final NotificationProducer notificationProducer;
    private final AuditEventProducer auditEventProducer;
    private final DashboardProducer dashboardProducer;
    private final NotificationService notificationService;

    @CircuitBreaker(name = "rdvService", fallbackMethod = "rdvFallback")
    @Retry(name = "rdvService")
    public Page<RendezVousResponse> getAll(Pageable pageable) {
        return rendezVousRepository.findAll(pageable).map(rendezVousMapper::toResponse);
    }

    public Page<RendezVousResponse> rdvFallback(Pageable pageable, Exception ex) {
        return Page.empty();
    }

    public RendezVousResponse getById(Long id) {
        RendezVous rdv = findOrThrow(id);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PATIENT"))) {
            Patient mine = patientRepository.findByUser_Email(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Fiche patient introuvable pour ce compte"));
            if (!rdv.getPatient().getId().equals(mine.getId())) {
                throw new AccessDeniedException("Accès refusé : ce rendez-vous ne vous appartient pas");
            }
        }
        return rendezVousMapper.toResponse(rdv);
    }

    @Transactional
    public RendezVousResponse creerRendezVous(RendezVousRequest request) {
        // Un PATIENT ne peut réserver que pour lui-même.
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PATIENT"))) {
            Patient mine = patientRepository.findByUser_Email(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Fiche patient introuvable pour ce compte"));
            if (!mine.getId().equals(request.getPatientId())) {
                throw new AccessDeniedException("Vous ne pouvez prendre un rendez-vous que pour vous-même");
            }
        }

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
        notificationService.notifierRdvPlanifie(saved);
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
        if (statut == StatutRdv.CONFIRME) {
            notificationService.notifierRdvConfirme(saved);
        } else if (statut == StatutRdv.ANNULE) {
            notificationProducer.envoyerAlerteAnnulation(saved);
            notificationService.notifierRdvAnnule(saved);
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

    public Page<RendezVousResponse> getMyRdvs(String email, Pageable pageable) {
        return rendezVousRepository.findByPatient_User_Email(email, pageable)
            .map(rendezVousMapper::toResponse);
    }

    /**
     * Returns all appointments for the authenticated médecin, sorted by dateHeure desc.
     * Used by GET /rendez-vous/medecin/me — avoids client-side filtering over all RDVs.
     */
    public Page<RendezVousResponse> getByMedecinEmail(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé: " + email));
        Medecin medecin = medecinRepository.findByUserId(user.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Profil médecin introuvable pour: " + email));
        return rendezVousRepository.findByMedecinId(medecin.getId(), pageable)
            .map(rendezVousMapper::toResponse);
    }

    @Transactional
    public RendezVousResponse annulerMien(Long id, String email) {
        RendezVous rdv = findOrThrow(id);
        Patient mine = patientRepository.findByUser_Email(email)
            .orElseThrow(() -> new ResourceNotFoundException("Fiche patient introuvable"));
        if (!rdv.getPatient().getId().equals(mine.getId())) {
            throw new AccessDeniedException("Ce rendez-vous ne vous appartient pas");
        }
        if (rdv.getStatut() == StatutRdv.ANNULE) {
            throw new IllegalStateException("Ce rendez-vous est déjà annulé");
        }
        rdv.setStatut(StatutRdv.ANNULE);
        RendezVous saved = rendezVousRepository.save(rdv);
        notificationService.notifierRdvAnnule(saved);
        auditEventProducer.publierEvenementAudit("ANNULER_MIEN", "RendezVous", id);
        return rendezVousMapper.toResponse(saved);
    }

    public List<String> getDisponibilites(Long medecinId, LocalDate date) {
        LocalDateTime debut = date.atTime(9, 0);
        LocalDateTime fin = date.atTime(17, 30);
        List<RendezVous> occupes = rendezVousRepository
            .findByMedecinIdAndDateHeureBetweenAndStatutNot(medecinId, debut, fin, StatutRdv.ANNULE);
        Set<LocalDateTime> heuresOccupees = occupes.stream()
            .map(RendezVous::getDateHeure)
            .collect(Collectors.toSet());
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("HH:mm");
        List<String> disponibles = new ArrayList<>();
        LocalDateTime slot = debut;
        while (!slot.isAfter(fin)) {
            if (!heuresOccupees.contains(slot)) {
                disponibles.add(slot.format(fmt));
            }
            slot = slot.plusMinutes(30);
        }
        return disponibles;
    }

    private RendezVous findOrThrow(Long id) {
        return rendezVousRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Rendez-vous non trouvé avec l'id: " + id));
    }
}
