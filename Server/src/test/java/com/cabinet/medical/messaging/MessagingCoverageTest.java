package com.cabinet.medical.messaging;

import com.cabinet.medical.entity.Patient;
import com.cabinet.medical.entity.RendezVous;
import com.cabinet.medical.messaging.consumer.AuditConsumer;
import com.cabinet.medical.messaging.consumer.EmailAlertConsumer;
import com.cabinet.medical.messaging.consumer.NotificationConsumer;
import com.cabinet.medical.messaging.dto.AlertMessage;
import com.cabinet.medical.messaging.dto.AuditMessage;
import com.cabinet.medical.messaging.dto.NotificationMessage;
import com.cabinet.medical.messaging.producer.AuditEventProducer;
import com.cabinet.medical.messaging.producer.DashboardProducer;
import com.cabinet.medical.messaging.producer.NotificationProducer;
import com.cabinet.medical.service.AuditService;
import com.cabinet.medical.support.TestDataFactory;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("JMS producers and consumers")
class MessagingCoverageTest {

    @Mock
    private JmsTemplate jmsTemplate;
    @Mock
    private AuditService auditService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("should publish appointment notification when rendezvous has patient and doctor")
    void shouldPublishAppointmentNotificationWhenRendezvousHasPatientAndDoctor() {
        NotificationProducer producer = new NotificationProducer(jmsTemplate);
        RendezVous rendezVous = TestDataFactory.rendezVous(1L, TestDataFactory.patient(2L), TestDataFactory.medecin(3L));
        ArgumentCaptor<NotificationMessage> captor = ArgumentCaptor.forClass(NotificationMessage.class);

        producer.envoyerNotificationRdv(rendezVous);

        verify(jmsTemplate).convertAndSend(eq("queue.notifications.rdv"), captor.capture());
        NotificationMessage message = captor.getValue();
        assertThat(message.getRdvId()).isEqualTo(1L);
        assertThat(message.getPatientEmail()).isEqualTo("patient2@mail.com");
        assertThat(message.getMedecinNom()).isEqualTo("House");
        assertThat(message.getType()).isEqualTo("RDV_CONFIRME");
    }

    @Test
    @DisplayName("should publish cancellation alert with empty nested values when relationships are missing")
    void shouldPublishCancellationAlertWithEmptyNestedValuesWhenRelationshipsAreMissing() {
        NotificationProducer producer = new NotificationProducer(jmsTemplate);
        RendezVous rendezVous = RendezVous.builder().id(4L).motif("Urgence").build();
        ArgumentCaptor<NotificationMessage> captor = ArgumentCaptor.forClass(NotificationMessage.class);

        producer.envoyerAlerteAnnulation(rendezVous);

        verify(jmsTemplate).convertAndSend(eq("queue.email.alerts"), captor.capture());
        NotificationMessage message = captor.getValue();
        assertThat(message.getPatientNom()).isEmpty();
        assertThat(message.getPatientEmail()).isEmpty();
        assertThat(message.getMedecinNom()).isEmpty();
        assertThat(message.getType()).isEqualTo("RDV_ANNULE");
    }

    @Test
    @DisplayName("should publish patient notification alert when patient has user email")
    void shouldPublishPatientNotificationAlertWhenPatientHasUserEmail() {
        NotificationProducer producer = new NotificationProducer(jmsTemplate);
        Patient patient = TestDataFactory.patient(5L);
        ArgumentCaptor<AlertMessage> captor = ArgumentCaptor.forClass(AlertMessage.class);

        producer.envoyerNotification(patient, "Votre dossier est pret");

        verify(jmsTemplate).convertAndSend(eq("queue.email.alerts"), captor.capture());
        AlertMessage message = captor.getValue();
        assertThat(message.getRecipient()).isEqualTo("patient5@mail.com");
        assertThat(message.getSubject()).contains("Notification Cabinet");
        assertThat(message.getBody()).isEqualTo("Votre dossier est pret");
    }

    @Test
    @DisplayName("should swallow notification send failure when jms template throws exception")
    void shouldSwallowNotificationSendFailureWhenJmsTemplateThrowsException() {
        NotificationProducer producer = new NotificationProducer(jmsTemplate);
        RendezVous rendezVous = TestDataFactory.rendezVous(6L, TestDataFactory.patient(7L), TestDataFactory.medecin(8L));
        doThrow(new IllegalStateException("broker down"))
            .when(jmsTemplate)
            .convertAndSend(org.mockito.ArgumentMatchers.<String>eq("queue.notifications.rdv"), any(Object.class));

        producer.envoyerNotificationRdv(rendezVous);

        verify(jmsTemplate).convertAndSend(org.mockito.ArgumentMatchers.<String>eq("queue.notifications.rdv"), any(Object.class));
    }

    @Test
    @DisplayName("should publish dashboard update when event type is provided")
    void shouldPublishDashboardUpdateWhenEventTypeIsProvided() {
        DashboardProducer producer = new DashboardProducer(jmsTemplate);

        producer.notifierMiseAJourDashboard("RDV_CREATED");

        verify(jmsTemplate).convertAndSend("topic.dashboard.update", "RDV_CREATED");
    }

    @Test
    @DisplayName("should publish audit event with authenticated username when security context exists")
    void shouldPublishAuditEventWithAuthenticatedUsernameWhenSecurityContextExists() {
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken("doctor@mail.com", "password"));
        AuditEventProducer producer = new AuditEventProducer(jmsTemplate);
        ArgumentCaptor<AuditMessage> captor = ArgumentCaptor.forClass(AuditMessage.class);

        producer.publierEvenementAudit("CREATE", "Patient", 9L);

        verify(jmsTemplate).convertAndSend(eq("queue.audit.events"), captor.capture());
        AuditMessage message = captor.getValue();
        assertThat(message.getAction()).isEqualTo("CREATE");
        assertThat(message.getEntite()).isEqualTo("Patient");
        assertThat(message.getEntiteId()).isEqualTo(9L);
        assertThat(message.getUtilisateur()).isEqualTo("doctor@mail.com");
        assertThat(message.getDetails()).isEqualTo("CREATE sur Patient id=9");
    }

    @Test
    @DisplayName("should publish audit event as system when no authentication exists")
    void shouldPublishAuditEventAsSystemWhenNoAuthenticationExists() {
        AuditEventProducer producer = new AuditEventProducer(jmsTemplate);
        ArgumentCaptor<AuditMessage> captor = ArgumentCaptor.forClass(AuditMessage.class);

        producer.publierEvenementAudit("DELETE", "Ordonnance", 10L);

        verify(jmsTemplate).convertAndSend(eq("queue.audit.events"), captor.capture());
        assertThat(captor.getValue().getUtilisateur()).isEqualTo("system");
    }

    @Test
    @DisplayName("should delegate audit consumer message to audit service")
    void shouldDelegateAuditConsumerMessageToAuditService() {
        AuditConsumer consumer = new AuditConsumer(auditService);
        AuditMessage message = AuditMessage.builder()
            .action("UPDATE")
            .entite("Mutuelle")
            .entiteId(11L)
            .utilisateur("admin@mail.com")
            .details("details")
            .build();

        consumer.recevoirEvenementAudit(message);

        verify(auditService).log("UPDATE", "Mutuelle", 11L, "admin@mail.com", "details");
    }

    @Test
    @DisplayName("should consume notification and email alerts without side effects")
    void shouldConsumeNotificationAndEmailAlertsWithoutSideEffects() {
        NotificationConsumer notificationConsumer = new NotificationConsumer();
        EmailAlertConsumer emailAlertConsumer = new EmailAlertConsumer();
        NotificationMessage notification = NotificationMessage.builder()
            .patientNom("Doe")
            .medecinNom("House")
            .dateHeure("2026-05-12T10:00")
            .build();
        AlertMessage alert = AlertMessage.builder()
            .recipient("patient@mail.com")
            .subject("Subject")
            .body("Body")
            .build();

        notificationConsumer.recevoirNotificationRdv(notification);
        emailAlertConsumer.recevoirAlerteEmail(alert);

        verify(auditService, never()).log(any(), any(), any(), any(), any());
    }
}
