package com.cabinet.medical.messaging.producer;

import com.cabinet.medical.entity.RendezVous;
import com.cabinet.medical.messaging.dto.NotificationMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationProducer {

    private final JmsTemplate jmsTemplate;
    private static final String QUEUE_RDV = "queue.notifications.rdv";
    private static final String QUEUE_ALERTS = "queue.email.alerts";

    public void envoyerNotificationRdv(RendezVous rdv) {
        try {
            NotificationMessage msg = NotificationMessage.builder()
                .rdvId(rdv.getId())
                .patientNom(rdv.getPatient() != null ? rdv.getPatient().getNom() : "")
                .patientEmail(rdv.getPatient() != null && rdv.getPatient().getUser() != null
                    ? rdv.getPatient().getUser().getEmail() : "")
                .medecinNom(rdv.getMedecin() != null ? rdv.getMedecin().getNom() : "")
                .dateHeure(rdv.getDateHeure() != null ? rdv.getDateHeure().toString() : "")
                .motif(rdv.getMotif())
                .type("RDV_CONFIRME")
                .build();
            jmsTemplate.convertAndSend(QUEUE_RDV, msg);
            log.debug("Notification RDV envoyée pour rdv id={}", rdv.getId());
        } catch (Exception e) {
            log.warn("JMS notification unavailable (rdv={}): {}", rdv.getId(), e.getMessage());
        }
    }

    public void envoyerAlerteAnnulation(RendezVous rdv) {
        try {
            NotificationMessage msg = NotificationMessage.builder()
                .rdvId(rdv.getId())
                .patientNom(rdv.getPatient() != null ? rdv.getPatient().getNom() : "")
                .patientEmail(rdv.getPatient() != null && rdv.getPatient().getUser() != null
                    ? rdv.getPatient().getUser().getEmail() : "")
                .medecinNom(rdv.getMedecin() != null ? rdv.getMedecin().getNom() : "")
                .dateHeure(rdv.getDateHeure() != null ? rdv.getDateHeure().toString() : "")
                .motif(rdv.getMotif())
                .type("RDV_ANNULE")
                .build();
            jmsTemplate.convertAndSend(QUEUE_ALERTS, msg);
            log.debug("Alerte annulation envoyée pour rdv id={}", rdv.getId());
        } catch (Exception e) {
            log.warn("JMS alert unavailable (rdv={}): {}", rdv.getId(), e.getMessage());
        }
    }

    public void envoyerNotification(com.cabinet.medical.entity.Patient patient, String message) {
        try {
            com.cabinet.medical.messaging.dto.AlertMessage alert = com.cabinet.medical.messaging.dto.AlertMessage.builder()
                .recipient(patient.getUser() != null ? patient.getUser().getEmail() : "")
                .subject("Notification Cabinet Médical")
                .body(message)
                .type("INFO")
                .build();
            jmsTemplate.convertAndSend(QUEUE_ALERTS, alert);
        } catch (Exception e) {
            log.warn("JMS notification unavailable: {}", e.getMessage());
        }
    }
}
