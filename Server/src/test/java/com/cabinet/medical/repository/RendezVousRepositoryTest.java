package com.cabinet.medical.repository;

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

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
class RendezVousRepositoryTest {

    @Autowired
    private RendezVousRepository rendezVousRepository;
    @Autowired
    private TestEntityManager entityManager;

    @Test
    void shouldFindAppointmentsByPatientEmail() {
        Patient patient = persistPatient("patient@mail.com");
        Medecin medecin = persistMedecin("doctor@mail.com");
        persistRendezVous(patient, medecin, LocalDateTime.of(2026, 5, 12, 10, 0));

        var result = rendezVousRepository.findByPatient_User_Email(patient.getUser().getEmail(), PageRequest.of(0, 10));

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void shouldDetectScheduleConflict() {
        Patient patient = persistPatient("patient@mail.com");
        Medecin medecin = persistMedecin("doctor@mail.com");
        LocalDateTime slot = LocalDateTime.of(2026, 5, 12, 10, 0);
        persistRendezVous(patient, medecin, slot);

        boolean conflict = rendezVousRepository.existsByMedecinIdAndDateHeureBetweenAndStatutNot(
            medecin.getId(), slot, slot.plusMinutes(30), StatutRdv.ANNULE);

        assertThat(conflict).isTrue();
    }

    @Test
    void shouldReturnOccupiedSlotsForDateRange() {
        Patient patient = persistPatient("patient@mail.com");
        Medecin medecin = persistMedecin("doctor@mail.com");
        LocalDateTime slot = LocalDate.of(2026, 5, 12).atTime(10, 0);
        persistRendezVous(patient, medecin, slot);

        var result = rendezVousRepository.findByMedecinIdAndDateHeureBetweenAndStatutNot(
            medecin.getId(), LocalDate.of(2026, 5, 12).atTime(9, 0), LocalDate.of(2026, 5, 12).atTime(17, 30), StatutRdv.ANNULE);

        assertThat(result).extracting(RendezVous::getDateHeure).containsExactly(slot);
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

    private void persistRendezVous(Patient patient, Medecin medecin, LocalDateTime slot) {
        entityManager.persistAndFlush(RendezVous.builder()
            .dateHeure(slot)
            .motif("Controle")
            .statut(StatutRdv.PLANIFIE)
            .patient(patient)
            .medecin(medecin)
            .build());
    }
}
