package com.cabinet.medical.service;

import com.cabinet.medical.entity.Notification;
import com.cabinet.medical.entity.Patient;
import com.cabinet.medical.entity.RendezVous;
import com.cabinet.medical.exception.ResourceNotFoundException;
import com.cabinet.medical.repository.NotificationRepository;
import com.cabinet.medical.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final PatientRepository patientRepository;

    // ── Public API ────────────────────────────────────────────────────────────

    public Page<Notification> getMyNotifications(String email, Pageable pageable) {
        Patient patient = resolvePatient(email);
        return notificationRepository.findByPatientOrderByDateCreationDesc(patient, pageable);
    }

    public long countUnread(String email) {
        Patient patient = resolvePatient(email);
        return notificationRepository.countByPatientAndLuFalse(patient);
    }

    @Transactional
    public Notification markRead(Long id, String email) {
        Notification notif = notificationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Notification introuvable: " + id));
        Patient patient = resolvePatient(email);
        if (!notif.getPatient().getId().equals(patient.getId())) {
            throw new AccessDeniedException("Cette notification ne vous appartient pas");
        }
        notif.setLu(true);
        return notificationRepository.save(notif);
    }

    @Transactional
    public void markAllRead(String email) {
        Patient patient = resolvePatient(email);
        notificationRepository.markAllAsReadByPatient(patient);
    }

    // ── Internal creation helpers (called from RendezVousService) ─────────────

    @Transactional
    public void notifierRdvPlanifie(RendezVous rdv) {
        String date = rdv.getDateHeure().format(DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm"));
        create(rdv.getPatient(),
            "Rendez-vous planifié",
            "Votre rendez-vous avec Dr. " + rdv.getMedecin().getPrenom() + " " + rdv.getMedecin().getNom()
            + " est planifié le " + date + (rdv.getMotif() != null ? " pour : " + rdv.getMotif() : "") + ".",
            "RDV_PLANIFIE");
    }

    @Transactional
    public void notifierRdvConfirme(RendezVous rdv) {
        String date = rdv.getDateHeure().format(DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm"));
        create(rdv.getPatient(),
            "Rendez-vous confirmé",
            "Votre rendez-vous du " + date + " avec Dr. "
            + rdv.getMedecin().getPrenom() + " " + rdv.getMedecin().getNom() + " a été confirmé.",
            "RDV_CONFIRME");
    }

    @Transactional
    public void notifierRdvAnnule(RendezVous rdv) {
        String date = rdv.getDateHeure().format(DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm"));
        create(rdv.getPatient(),
            "Rendez-vous annulé",
            "Votre rendez-vous du " + date + " avec Dr. "
            + rdv.getMedecin().getPrenom() + " " + rdv.getMedecin().getNom() + " a été annulé.",
            "RDV_ANNULE");
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private void create(Patient patient, String titre, String message, String type) {
        notificationRepository.save(Notification.builder()
            .patient(patient)
            .titre(titre)
            .message(message)
            .type(type)
            .lu(false)
            .dateCreation(LocalDateTime.now())
            .build());
    }

    private Patient resolvePatient(String email) {
        return patientRepository.findByUser_Email(email)
            .orElseThrow(() -> new ResourceNotFoundException("Fiche patient introuvable pour ce compte"));
    }
}
