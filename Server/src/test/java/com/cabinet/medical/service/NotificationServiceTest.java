package com.cabinet.medical.service;

import com.cabinet.medical.entity.Notification;
import com.cabinet.medical.entity.Patient;
import com.cabinet.medical.entity.RendezVous;
import com.cabinet.medical.repository.NotificationRepository;
import com.cabinet.medical.repository.PatientRepository;
import com.cabinet.medical.support.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private PatientRepository patientRepository;

    @InjectMocks
    private NotificationService notificationService;

    @Test
    void shouldMarkNotificationAsRead() {
        Patient patient = TestDataFactory.patient(1L);
        Notification notification = TestDataFactory.notification(9L, patient);

        when(notificationRepository.findById(9L)).thenReturn(Optional.of(notification));
        when(patientRepository.findByUser_Email(patient.getUser().getEmail())).thenReturn(Optional.of(patient));
        when(notificationRepository.save(notification)).thenReturn(notification);

        Notification result = notificationService.markRead(9L, patient.getUser().getEmail());

        assertThat(result.isLu()).isTrue();
        verify(notificationRepository).save(notification);
    }

    @Test
    void shouldThrowExceptionWhenMarkingForeignNotification() {
        Patient owner = TestDataFactory.patient(1L);
        Patient other = TestDataFactory.patient(2L);
        Notification notification = TestDataFactory.notification(9L, owner);

        when(notificationRepository.findById(9L)).thenReturn(Optional.of(notification));
        when(patientRepository.findByUser_Email(other.getUser().getEmail())).thenReturn(Optional.of(other));

        assertThatThrownBy(() -> notificationService.markRead(9L, other.getUser().getEmail()))
            .isInstanceOf(org.springframework.security.access.AccessDeniedException.class)
            .hasMessageContaining("ne vous appartient pas");
    }

    @Test
    void shouldCreateAppointmentPlannedNotification() {
        Patient patient = TestDataFactory.patient(1L);
        RendezVous rendezVous = TestDataFactory.rendezVous(3L, patient, TestDataFactory.medecin(2L));
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);

        notificationService.notifierRdvPlanifie(rendezVous);

        verify(notificationRepository).save(captor.capture());
        assertThat(captor.getValue().getType()).isEqualTo("RDV_PLANIFIE");
        assertThat(captor.getValue().getPatient().getId()).isEqualTo(patient.getId());
    }
}
