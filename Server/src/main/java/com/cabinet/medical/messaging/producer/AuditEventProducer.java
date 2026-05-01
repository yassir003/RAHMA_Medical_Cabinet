package com.cabinet.medical.messaging.producer;

import com.cabinet.medical.messaging.dto.AuditMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuditEventProducer {

    private final JmsTemplate jmsTemplate;
    private static final String QUEUE_AUDIT = "queue.audit.events";

    public void publierEvenementAudit(String action, String entite, Long entiteId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String utilisateur = auth != null ? auth.getName() : "system";
        AuditMessage msg = AuditMessage.builder()
            .action(action)
            .entite(entite)
            .entiteId(entiteId)
            .utilisateur(utilisateur)
            .details(action + " sur " + entite + " id=" + entiteId)
            .build();
        jmsTemplate.convertAndSend(QUEUE_AUDIT, msg);
        log.debug("Événement audit publié: {} {} {}", action, entite, entiteId);
    }
}
