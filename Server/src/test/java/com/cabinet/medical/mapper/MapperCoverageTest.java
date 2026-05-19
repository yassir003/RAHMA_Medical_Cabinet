package com.cabinet.medical.mapper;

import com.cabinet.medical.dto.response.ConsultationResponse;
import com.cabinet.medical.dto.response.DossierRemboursementResponse;
import com.cabinet.medical.dto.response.MedecinResponse;
import com.cabinet.medical.dto.response.MutuelleResponse;
import com.cabinet.medical.dto.response.OrdonnanceResponse;
import com.cabinet.medical.dto.response.OrdonnanceSummaryResponse;
import com.cabinet.medical.dto.response.PatientResponse;
import com.cabinet.medical.dto.response.RendezVousResponse;
import com.cabinet.medical.dto.response.SecretaireResponse;
import com.cabinet.medical.entity.Consultation;
import com.cabinet.medical.entity.DossierRemboursement;
import com.cabinet.medical.entity.LigneMedicament;
import com.cabinet.medical.entity.Medecin;
import com.cabinet.medical.entity.Mutuelle;
import com.cabinet.medical.entity.Ordonnance;
import com.cabinet.medical.entity.Patient;
import com.cabinet.medical.entity.RendezVous;
import com.cabinet.medical.entity.Secretaire;
import com.cabinet.medical.enums.StatutDossier;
import com.cabinet.medical.enums.StatutOrdonnance;
import com.cabinet.medical.enums.TypeMutuelle;
import com.cabinet.medical.support.TestDataFactory;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("MapStruct and manual mappers")
class MapperCoverageTest {

    private final PatientMapper patientMapper = Mappers.getMapper(PatientMapper.class);
    private final MedecinMapper medecinMapper = Mappers.getMapper(MedecinMapper.class);
    private final SecretaireMapper secretaireMapper = Mappers.getMapper(SecretaireMapper.class);
    private final RendezVousMapper rendezVousMapper = Mappers.getMapper(RendezVousMapper.class);
    private final MutuelleMapper mutuelleMapper = Mappers.getMapper(MutuelleMapper.class);
    private final DossierRemboursementMapper dossierMapper = Mappers.getMapper(DossierRemboursementMapper.class);
    private final OrdonnanceMapper ordonnanceMapper = new OrdonnanceMapper();
    private final ConsultationMapper consultationMapper = consultationMapper();

    @Test
    @DisplayName("should map patient fields and email when patient has user")
    void shouldMapPatientFieldsAndEmailWhenPatientHasUser() {
        Patient patient = TestDataFactory.patient(1L);

        PatientResponse response = patientMapper.toResponse(patient);

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getCin()).isEqualTo("CIN-1");
        assertThat(response.getEmail()).isEqualTo("patient1@mail.com");
        assertThat(response.getGroupeSanguin()).isEqualTo("A+");
    }

    @Test
    @DisplayName("should map patient email as null when patient has no user")
    void shouldMapPatientEmailAsNullWhenPatientHasNoUser() {
        Patient patient = TestDataFactory.patient(2L);
        patient.setUser(null);

        PatientResponse response = patientMapper.toResponse(patient);

        assertThat(response.getId()).isEqualTo(2L);
        assertThat(response.getEmail()).isNull();
    }

    @Test
    @DisplayName("should map doctor and secretary user emails when source contains accounts")
    void shouldMapDoctorAndSecretaryUserEmailsWhenSourceContainsAccounts() {
        Medecin medecin = TestDataFactory.medecin(3L);
        Secretaire secretaire = Secretaire.builder()
            .id(4L)
            .nom("Smith")
            .prenom("Anna")
            .telephone("0611223344")
            .user(TestDataFactory.user(44L, "secretary@mail.com", com.cabinet.medical.enums.Role.SECRETAIRE))
            .build();

        MedecinResponse medecinResponse = medecinMapper.toResponse(medecin);
        SecretaireResponse secretaireResponse = secretaireMapper.toResponse(secretaire);

        assertThat(medecinResponse.getEmail()).isEqualTo("doctor3@mail.com");
        assertThat(medecinResponse.getSpecialite()).isEqualTo("Cardiology");
        assertThat(secretaireResponse.getEmail()).isEqualTo("secretary@mail.com");
        assertThat(secretaireResponse.getTelephone()).isEqualTo("0611223344");
    }

    @Test
    @DisplayName("should map appointment nested patient and doctor fields when relationships exist")
    void shouldMapAppointmentNestedPatientAndDoctorFieldsWhenRelationshipsExist() {
        Patient patient = TestDataFactory.patient(5L);
        Medecin medecin = TestDataFactory.medecin(6L);
        RendezVous rendezVous = TestDataFactory.rendezVous(7L, patient, medecin);

        RendezVousResponse response = rendezVousMapper.toResponse(rendezVous);

        assertThat(response.getId()).isEqualTo(7L);
        assertThat(response.getPatientId()).isEqualTo(5L);
        assertThat(response.getPatientNom()).isEqualTo("Doe");
        assertThat(response.getMedecinId()).isEqualTo(6L);
        assertThat(response.getMedecinSpecialite()).isEqualTo("Cardiology");
    }

    @Test
    @DisplayName("should map consultation nested patient doctor and appointment fields when relationships exist")
    void shouldMapConsultationNestedPatientDoctorAndAppointmentFieldsWhenRelationshipsExist() {
        Patient patient = TestDataFactory.patient(8L);
        Medecin medecin = TestDataFactory.medecin(9L);
        RendezVous rendezVous = TestDataFactory.rendezVous(10L, patient, medecin);
        Consultation consultation = TestDataFactory.consultation(11L, patient, medecin, rendezVous);

        ConsultationResponse response = consultationMapper.toResponse(consultation);

        assertThat(response.getId()).isEqualTo(11L);
        assertThat(response.getPatientId()).isEqualTo(8L);
        assertThat(response.getPatientCin()).isEqualTo("CIN-8");
        assertThat(response.getMedecinId()).isEqualTo(9L);
        assertThat(response.getRendezVousId()).isEqualTo(10L);
    }

    @Test
    @DisplayName("should map insurance nested patient fields when mutuelle has patient")
    void shouldMapInsuranceNestedPatientFieldsWhenMutuelleHasPatient() {
        Patient patient = TestDataFactory.patient(12L);
        Mutuelle mutuelle = Mutuelle.builder()
            .id(13L)
            .type(TypeMutuelle.CNOPS)
            .numeroAffiliation("AFF-13")
            .organismeNom("CNOPS")
            .dateAffiliation(LocalDate.of(2024, 2, 3))
            .immatriculation(123456L)
            .somEtabPens(99L)
            .patient(patient)
            .build();

        MutuelleResponse response = mutuelleMapper.toResponse(mutuelle);

        assertThat(response.getId()).isEqualTo(13L);
        assertThat(response.getType()).isEqualTo(TypeMutuelle.CNOPS);
        assertThat(response.getPatientId()).isEqualTo(12L);
        assertThat(response.getPatientPrenom()).isEqualTo("Jane");
    }

    @Test
    @DisplayName("should map reimbursement dossier nested relationships when dossier is complete")
    void shouldMapReimbursementDossierNestedRelationshipsWhenDossierIsComplete() {
        Patient patient = TestDataFactory.patient(14L);
        Medecin medecin = TestDataFactory.medecin(15L);
        Consultation consultation = TestDataFactory.consultation(16L, patient, medecin, null);
        Mutuelle mutuelle = Mutuelle.builder()
            .id(17L)
            .organismeNom("Private Health")
            .dateAffiliation(LocalDate.of(2023, 6, 1))
            .immatriculation(456789L)
            .somEtabPens(77L)
            .patient(patient)
            .build();
        DossierRemboursement dossier = DossierRemboursement.builder()
            .id(18L)
            .dateCreation(LocalDateTime.of(2026, 5, 1, 9, 0))
            .dateEnvoi(LocalDateTime.of(2026, 5, 2, 9, 0))
            .statut(StatutDossier.ENVOYE)
            .patient(patient)
            .mutuelle(mutuelle)
            .consultation(consultation)
            .documentJustificatif("invoice.pdf")
            .build();

        DossierRemboursementResponse response = dossierMapper.toResponse(dossier);

        assertThat(response.getId()).isEqualTo(18L);
        assertThat(response.getPatientId()).isEqualTo(14L);
        assertThat(response.getMutuelleId()).isEqualTo(17L);
        assertThat(response.getMutuelleOrganisme()).isEqualTo("Private Health");
        assertThat(response.getConsultationId()).isEqualTo(16L);
    }

    @Test
    @DisplayName("should map ordonnance response with summaries and medicines when ordonnance is complete")
    void shouldMapOrdonnanceResponseWithSummariesAndMedicinesWhenOrdonnanceIsComplete() {
        Patient patient = TestDataFactory.patient(19L);
        Medecin medecin = TestDataFactory.medecin(20L);
        Consultation consultation = TestDataFactory.consultation(21L, patient, medecin, null);
        Ordonnance ordonnance = ordonnance(22L, patient, medecin, consultation, List.of(medicament(23L)));

        OrdonnanceResponse response = ordonnanceMapper.toResponse(ordonnance);

        assertThat(response.getId()).isEqualTo(22L);
        assertThat(response.getPatient().getId()).isEqualTo(19L);
        assertThat(response.getMedecin().getSpecialite()).isEqualTo("Cardiology");
        assertThat(response.getConsultation().getId()).isEqualTo(21L);
        assertThat(response.getMedicaments()).hasSize(1);
        assertThat(response.getMedicaments().get(0).getNomMedicament()).isEqualTo("Paracetamol");
    }

    @Test
    @DisplayName("should map ordonnance summary with empty medicines when medicines are null")
    void shouldMapOrdonnanceSummaryWithEmptyMedicinesWhenMedicinesAreNull() {
        Ordonnance ordonnance = ordonnance(24L, null, null, null, null);

        OrdonnanceSummaryResponse response = ordonnanceMapper.toSummary(ordonnance);

        assertThat(response.getId()).isEqualTo(24L);
        assertThat(response.getStatut()).isEqualTo(StatutOrdonnance.ACTIVE);
        assertThat(response.getMedicaments()).isEmpty();
    }

    @Test
    @DisplayName("should return null when ordonnance source is null")
    void shouldReturnNullWhenOrdonnanceSourceIsNull() {
        assertThat(ordonnanceMapper.toResponse(null)).isNull();
        assertThat(ordonnanceMapper.toSummary(null)).isNull();
    }

    private ConsultationMapper consultationMapper() {
        ConsultationMapper mapper = Mappers.getMapper(ConsultationMapper.class);
        ReflectionTestUtils.setField(mapper, "ordonnanceMapper", ordonnanceMapper);
        return mapper;
    }

    private Ordonnance ordonnance(Long id, Patient patient, Medecin medecin, Consultation consultation,
                                  List<LigneMedicament> medicaments) {
        return Ordonnance.builder()
            .id(id)
            .dateCreation(LocalDateTime.of(2026, 5, 12, 12, 0))
            .dureeTraitement("7 jours")
            .instructions("Apres repas")
            .statut(StatutOrdonnance.ACTIVE)
            .patient(patient)
            .medecin(medecin)
            .consultation(consultation)
            .medicaments(medicaments)
            .build();
    }

    private LigneMedicament medicament(Long id) {
        return LigneMedicament.builder()
            .id(id)
            .nomMedicament("Paracetamol")
            .dosage("1g")
            .frequence("2 fois/jour")
            .duree("5 jours")
            .instructions("Avec eau")
            .build();
    }
}
