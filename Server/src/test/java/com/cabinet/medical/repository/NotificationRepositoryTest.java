package com.cabinet.medical.repository;

import com.cabinet.medical.entity.Notification;
import com.cabinet.medical.entity.Patient;
import com.cabinet.medical.entity.User;
import com.cabinet.medical.enums.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
class NotificationRepositoryTest {

    @Autowired
    private NotificationRepository notificationRepository;
    @Autowired
    private TestEntityManager entityManager;

    @Test
    void shouldCountUnreadNotifications() {
        Patient patient = persistPatient();
        persistNotification(patient, false);
        persistNotification(patient, true);

        long count = notificationRepository.countByPatientAndLuFalse(patient);

        assertThat(count).isEqualTo(1);
    }

    @Test
    void shouldMarkAllNotificationsAsRead() {
        Patient patient = persistPatient();
        persistNotification(patient, false);
        persistNotification(patient, false);

        notificationRepository.markAllAsReadByPatient(patient);
        entityManager.flush();
        entityManager.clear();

        var result = notificationRepository.findByPatientOrderByDateCreationDesc(patient, PageRequest.of(0, 10));

        assertThat(result.getContent()).allMatch(Notification::isLu);
    }

    private Patient persistPatient() {
        User user = entityManager.persist(User.builder()
            .email("patient@mail.com")
            .password("password")
            .role(Role.PATIENT)
            .enabled(true)
            .passwordChanged(true)
            .build());
        return entityManager.persistAndFlush(Patient.builder().nom("Doe").prenom("Jane").cin("P1").user(user).build());
    }

    private void persistNotification(Patient patient, boolean read) {
        entityManager.persistAndFlush(Notification.builder()
            .patient(patient)
            .titre("Notification")
            .message("Message")
            .type("SYSTEME")
            .lu(read)
            .dateCreation(LocalDateTime.now())
            .build());
    }
}
