package com.cabinet.medical.repository;

import com.cabinet.medical.entity.Consultation;
import com.cabinet.medical.entity.Medecin;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
class ConsultationRepositoryTest {

    @Autowired
    private ConsultationRepository consultationRepository;
    @Autowired
    private TestEntityManager entityManager;

    @Test
    void shouldFindConsultationsByPatientId() {
        Patient patient = persistPatient("patient@mail.com");
        Medecin medecin = persistMedecin("doctor@mail.com");
        persistConsultation(patient, medecin);

        var result = consultationRepository.findByPatientId(patient.getId(), PageRequest.of(0, 10));

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void shouldCountConsultationsByMedecinId() {
        Patient patient = persistPatient("patient@mail.com");
        Medecin medecin = persistMedecin("doctor@mail.com");
        persistConsultation(patient, medecin);

        long count = consultationRepository.countByMedecinId(medecin.getId());

        assertThat(count).isEqualTo(1);
    }

    private Patient persistPatient(String email) {
        User user = entityManager.persist(User.builder()
            .email(email)
            .password("password")
            .role(Role.PATIENT)
            .enabled(true)
            .passwordChanged(true)
            .build());
        return entityManager.persistAndFlush(Patient.builder().nom("Doe").prenom("Jane").cin(email).user(user).build());
    }

    private Medecin persistMedecin(String email) {
        User user = entityManager.persist(User.builder()
            .email(email)
            .password("password")
            .role(Role.MEDECIN)
            .enabled(true)
            .passwordChanged(true)
            .build());
        return entityManager.persistAndFlush(Medecin.builder().nom("House").prenom("Gregory").specialite("Cardiology").user(user).build());
    }

    private void persistConsultation(Patient patient, Medecin medecin) {
        entityManager.persistAndFlush(Consultation.builder()
            .dateVisite(LocalDateTime.of(2026, 5, 12, 11, 0))
            .motif("Suivi")
            .montantTotal(BigDecimal.valueOf(200))
            .patient(patient)
            .medecin(medecin)
            .build());
    }
}
