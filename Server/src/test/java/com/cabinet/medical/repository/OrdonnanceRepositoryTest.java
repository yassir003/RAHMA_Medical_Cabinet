package com.cabinet.medical.repository;

import com.cabinet.medical.entity.Consultation;
import com.cabinet.medical.entity.Medecin;
import com.cabinet.medical.entity.Ordonnance;
import com.cabinet.medical.entity.Patient;
import com.cabinet.medical.entity.User;
import com.cabinet.medical.enums.Role;
import com.cabinet.medical.enums.StatutOrdonnance;
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
class OrdonnanceRepositoryTest {

    @Autowired
    private OrdonnanceRepository ordonnanceRepository;
    @Autowired
    private TestEntityManager entityManager;

    @Test
    void shouldFindOrdonnanceByConsultationId() {
        Ordonnance ordonnance = persistOrdonnance();

        var result = ordonnanceRepository.findByConsultationId(ordonnance.getConsultation().getId());

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(ordonnance.getId());
    }

    @Test
    void shouldFindOrdonnancesByPatientEmailAndStatus() {
        Ordonnance ordonnance = persistOrdonnance();

        var result = ordonnanceRepository.findByPatientUserEmailAndStatut(
            ordonnance.getPatient().getUser().getEmail(), StatutOrdonnance.ACTIVE, PageRequest.of(0, 10));

        assertThat(result.getContent()).hasSize(1);
    }

    private Ordonnance persistOrdonnance() {
        User patientUser = entityManager.persist(User.builder()
            .email("patient@mail.com")
            .password("password")
            .role(Role.PATIENT)
            .enabled(true)
            .passwordChanged(true)
            .build());
        User doctorUser = entityManager.persist(User.builder()
            .email("doctor@mail.com")
            .password("password")
            .role(Role.MEDECIN)
            .enabled(true)
            .passwordChanged(true)
            .build());
        Patient patient = entityManager.persist(Patient.builder().nom("Doe").prenom("Jane").cin("P2").user(patientUser).build());
        Medecin medecin = entityManager.persist(Medecin.builder().nom("House").prenom("Gregory").specialite("Cardiology").user(doctorUser).build());
        Consultation consultation = entityManager.persist(Consultation.builder()
            .dateVisite(LocalDateTime.of(2026, 5, 12, 11, 0))
            .motif("Suivi")
            .montantTotal(BigDecimal.valueOf(200))
            .patient(patient)
            .medecin(medecin)
            .build());
        return entityManager.persistAndFlush(Ordonnance.builder()
            .consultation(consultation)
            .patient(patient)
            .medecin(medecin)
            .dateCreation(LocalDateTime.of(2026, 5, 12, 12, 0))
            .dureeTraitement("5 jours")
            .instructions("Instructions")
            .statut(StatutOrdonnance.ACTIVE)
            .build());
    }
}
