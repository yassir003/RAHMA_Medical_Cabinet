package com.cabinet.medical.messaging.producer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DashboardProducer {

    private final JmsTemplate jmsTemplate;
    private static final String TOPIC_DASHBOARD = "topic.dashboard.update";

    public void notifierMiseAJourDashboard(String typeEvenement) {
        jmsTemplate.convertAndSend(TOPIC_DASHBOARD, typeEvenement);
        log.debug("Dashboard mis à jour: {}", typeEvenement);
    }
}
