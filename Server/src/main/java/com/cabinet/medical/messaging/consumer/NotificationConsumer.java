package com.cabinet.medical.messaging.consumer;

import com.cabinet.medical.messaging.dto.NotificationMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jms.annotation.JmsListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class NotificationConsumer {

    @JmsListener(destination = "queue.notifications.rdv")
    public void recevoirNotificationRdv(NotificationMessage message) {
        log.info("Notification RDV reçue: patient={}, médecin={}, date={}",
            message.getPatientNom(), message.getMedecinNom(), message.getDateHeure());
    }
}
