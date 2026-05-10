package com.cabinet.medical.repository;

import com.cabinet.medical.entity.Consultation;
import com.cabinet.medical.entity.Medecin;
import com.cabinet.medical.entity.Patient;
import com.cabinet.medical.entity.RendezVous;
import com.cabinet.medical.entity.User;
import com.cabinet.medical.enums.Role;
import com.cabinet.medical.enums.StatutRdv;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
class PatientRepositoryTest {

    @Autowired
    private PatientRepository patientRepository;
    @Autowired
    private TestEntityManager entityManager;

    @Test
    void shouldFindPatientByCin() {
        Patient patient = persistPatient("CIN-123", "jane@mail.com");

        var result = patientRepository.findByCin("CIN-123");

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(patient.getId());
    }

    @Test
    void shouldFindPatientsByMedecinId() {
        Medecin medecin = persistMedecin("doctor@mail.com");
        Patient patient = persistPatient("CIN-456", "patient@mail.com");

        entityManager.persist(RendezVous.builder()
            .dateHeure(LocalDateTime.of(2026, 5, 12, 10, 0))
            .motif("Controle")
            .statut(StatutRdv.PLANIFIE)
            .patient(patient)
            .medecin(medecin)
            .build());
        entityManager.persist(Consultation.builder()
            .dateVisite(LocalDateTime.of(2026, 5, 12, 11, 0))
            .motif("Suivi")
            .montantTotal(BigDecimal.valueOf(200))
            .patient(patient)
            .medecin(medecin)
            .build());
        entityManager.flush();

        var result = patientRepository.findPatientsByMedecinId(medecin.getId(), "Doe", PageRequest.of(0, 10));

        assertThat(result.getContent()).extracting(Patient::getCin).containsExactly("CIN-456");
    }

    private Patient persistPatient(String cin, String email) {
        User user = entityManager.persist(User.builder()
            .email(email)
            .password("password")
            .role(Role.PATIENT)
            .enabled(true)
            .passwordChanged(true)
            .build());
        Patient patient = Patient.builder()
            .nom("Doe")
            .prenom("Jane")
            .cin(cin)
            .dateNaissance(LocalDate.of(1990, 1, 1))
            .user(user)
            .build();
        return entityManager.persistAndFlush(patient);
    }

    private Medecin persistMedecin(String email) {
        User user = entityManager.persist(User.builder()
            .email(email)
            .password("password")
            .role(Role.MEDECIN)
            .enabled(true)
            .passwordChanged(true)
            .build());
        return entityManager.persistAndFlush(Medecin.builder()
            .nom("House")
            .prenom("Gregory")
            .specialite("Cardiology")
            .user(user)
            .build());
    }
}
