package com.cabinet.medical.messaging.consumer;

import com.cabinet.medical.messaging.dto.AlertMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jms.annotation.JmsListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class EmailAlertConsumer {

    @JmsListener(destination = "queue.email.alerts")
    public void recevoirAlerteEmail(AlertMessage message) {
        log.info("Alerte email reçue: destinataire={}, sujet={}", message.getRecipient(), message.getSubject());
    }
}
