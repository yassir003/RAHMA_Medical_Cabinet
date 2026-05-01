package com.cabinet.medical.messaging.consumer;

import com.cabinet.medical.messaging.dto.AuditMessage;
import com.cabinet.medical.service.AuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jms.annotation.JmsListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuditConsumer {

    private final AuditService auditService;

    @JmsListener(destination = "queue.audit.events")
    public void recevoirEvenementAudit(AuditMessage message) {
        auditService.log(message.getAction(), message.getEntite(),
            message.getEntiteId(), message.getUtilisateur(), message.getDetails());
        log.debug("Événement audit traité: {} {}", message.getAction(), message.getEntite());
    }
}
