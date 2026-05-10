package com.cabinet.medical.support;

import com.cabinet.medical.dto.request.ChangePasswordRequest;
import com.cabinet.medical.dto.request.ConsultationRequest;
import com.cabinet.medical.dto.request.LigneMedicamentRequest;
import com.cabinet.medical.dto.request.LoginRequest;
import com.cabinet.medical.dto.request.OrdonnanceRequest;
import com.cabinet.medical.dto.request.PatientRequest;
import com.cabinet.medical.dto.request.RegisterRequest;
import com.cabinet.medical.dto.request.RendezVousRequest;
import com.cabinet.medical.dto.response.ConsultationResponse;
import com.cabinet.medical.dto.response.MedecinResponse;
import com.cabinet.medical.dto.response.PatientResponse;
import com.cabinet.medical.dto.response.RendezVousResponse;
import com.cabinet.medical.entity.Consultation;
import com.cabinet.medical.entity.Medecin;
import com.cabinet.medical.entity.Notification;
import com.cabinet.medical.entity.Patient;
import com.cabinet.medical.entity.RendezVous;
import com.cabinet.medical.entity.User;
import com.cabinet.medical.enums.Role;
import com.cabinet.medical.enums.StatutRdv;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public final class TestDataFactory {

    private TestDataFactory() {
    }

    public static User user(Long id, String email, Role role) {
        return User.builder()
            .id(id)
            .email(email)
            .password("encoded-password")
            .role(role)
            .enabled(true)
            .passwordChanged(true)
            .build();
    }

    public static Patient patient(Long id) {
        return Patient.builder()
            .id(id)
            .nom("Doe")
            .prenom("Jane")
            .cin("CIN-" + id)
            .dateNaissance(LocalDate.of(1990, 1, 1))
            .telephone("0600000000")
            .adresse("Casablanca")
            .groupeSanguin("A+")
            .allergies("Pollen")
            .antecedents("None")
            .user(user(id, "patient" + id + "@mail.com", Role.PATIENT))
            .build();
    }

    public static Medecin medecin(Long id) {
        return Medecin.builder()
            .id(id)
            .nom("House")
            .prenom("Gregory")
            .specialite("Cardiology")
            .telephone("0700000000")
            .user(user(100 + id, "doctor" + id + "@mail.com", Role.MEDECIN))
            .build();
    }

    public static RendezVous rendezVous(Long id, Patient patient, Medecin medecin) {
        return RendezVous.builder()
            .id(id)
            .dateHeure(LocalDateTime.of(2026, 5, 12, 10, 0))
            .motif("Controle")
            .notes("RAS")
            .statut(StatutRdv.PLANIFIE)
            .patient(patient)
            .medecin(medecin)
            .build();
    }

    public static Consultation consultation(Long id, Patient patient, Medecin medecin, RendezVous rendezVous) {
        return Consultation.builder()
            .id(id)
            .dateVisite(LocalDateTime.of(2026, 5, 12, 11, 0))
            .motif("Suivi")
            .diagnostic("Diagnostic complet")
            .diagnosticPatient("Explication simplifiee")
            .notes("Notes internes")
            .actesRealises("Acte")
            .montantTotal(BigDecimal.valueOf(250))
            .patient(patient)
            .medecin(medecin)
            .rendezVous(rendezVous)
            .build();
    }

    public static Notification notification(Long id, Patient patient) {
        return Notification.builder()
            .id(id)
            .titre("Rendez-vous confirme")
            .message("Votre rendez-vous a ete confirme.")
            .type("RDV_CONFIRME")
            .lu(false)
            .dateCreation(LocalDateTime.of(2026, 5, 12, 8, 0))
            .patient(patient)
            .build();
    }

    public static PatientRequest patientRequest() {
        PatientRequest request = new PatientRequest();
        request.setNom("Doe");
        request.setPrenom("Jane");
        request.setCin("AB123456");
        request.setDateNaissance(LocalDate.of(1990, 1, 1));
        request.setTelephone("0600112233");
        request.setAdresse("Rabat");
        request.setGroupeSanguin("O+");
        request.setAllergies("None");
        request.setAntecedents("None");
        request.setEmail("jane.doe@mail.com");
        request.setPassword("Password123");
        return request;
    }

    public static RendezVousRequest rendezVousRequest() {
        RendezVousRequest request = new RendezVousRequest();
        request.setDateHeure(LocalDateTime.of(2026, 5, 12, 10, 0));
        request.setMotif("Consultation generale");
        request.setNotes("A jeun");
        request.setPatientId(1L);
        request.setMedecinId(2L);
        return request;
    }

    public static ConsultationRequest consultationRequest() {
        ConsultationRequest request = new ConsultationRequest();
        request.setDateVisite(LocalDateTime.of(2026, 5, 12, 11, 0));
        request.setMotif("Controle annuel");
        request.setDiagnostic("Diagnostic");
        request.setDiagnosticPatient("Diagnostic patient");
        request.setNotes("Notes");
        request.setActesRealises("Actes");
        request.setMontantTotal(BigDecimal.valueOf(300));
        request.setPatientId(1L);
        request.setMedecinId(2L);
        request.setRendezVousId(3L);
        return request;
    }

    public static RegisterRequest registerRequest() {
        RegisterRequest request = new RegisterRequest();
        request.setNom("Doe");
        request.setPrenom("Jane");
        request.setCin("AB123456");
        request.setDateNaissance(LocalDate.of(1990, 1, 1));
        request.setTelephone("0600112233");
        request.setAdresse("Rabat");
        request.setEmail("jane.doe@mail.com");
        request.setPassword("Password123");
        return request;
    }

    public static LoginRequest loginRequest() {
        LoginRequest request = new LoginRequest();
        request.setEmail("jane.doe@mail.com");
        request.setPassword("Password123");
        return request;
    }

    public static ChangePasswordRequest changePasswordRequest() {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setAncienMotDePasse("OldPassword123");
        request.setNouveauMotDePasse("NewPassword123");
        return request;
    }

    public static OrdonnanceRequest ordonnanceRequest() {
        LigneMedicamentRequest ligne = new LigneMedicamentRequest();
        ligne.setNomMedicament("Paracetamol");
        ligne.setDosage("1g");
        ligne.setFrequence("2 fois/jour");
        ligne.setDuree("5 jours");
        ligne.setInstructions("Apres repas");

        OrdonnanceRequest request = new OrdonnanceRequest();
        request.setConsultationId(1L);
        request.setDureeTraitement("5 jours");
        request.setInstructions("Bien s'hydrater");
        request.setMedicaments(java.util.List.of(ligne));
        return request;
    }

    public static PatientResponse patientResponse(Long id) {
        PatientResponse response = new PatientResponse();
        response.setId(id);
        response.setNom("Doe");
        response.setPrenom("Jane");
        response.setCin("AB123456");
        response.setEmail("jane.doe@mail.com");
        response.setTelephone("0600112233");
        return response;
    }

    public static MedecinResponse medecinResponse(Long id) {
        MedecinResponse response = new MedecinResponse();
        response.setId(id);
        response.setNom("House");
        response.setPrenom("Gregory");
        response.setSpecialite("Cardiology");
        response.setTelephone("0700000000");
        response.setEmail("doctor@mail.com");
        return response;
    }

    public static RendezVousResponse rendezVousResponse(Long id) {
        RendezVousResponse response = new RendezVousResponse();
        response.setId(id);
        response.setDateHeure(LocalDateTime.of(2026, 5, 12, 10, 0));
        response.setMotif("Controle");
        response.setNotes("RAS");
        response.setStatut(StatutRdv.PLANIFIE);
        response.setPatientId(1L);
        response.setPatientNom("Doe");
        response.setPatientPrenom("Jane");
        response.setMedecinId(2L);
        response.setMedecinNom("House");
        response.setMedecinPrenom("Gregory");
        response.setMedecinSpecialite("Cardiology");
        return response;
    }

    public static ConsultationResponse consultationResponse(Long id) {
        ConsultationResponse response = new ConsultationResponse();
        response.setId(id);
        response.setDateVisite(LocalDateTime.of(2026, 5, 12, 11, 0));
        response.setMotif("Controle annuel");
        response.setDiagnostic("Diagnostic");
        response.setDiagnosticPatient("Diagnostic patient");
        response.setNotes("Notes");
        response.setActesRealises("Actes");
        response.setMontantTotal(BigDecimal.valueOf(300));
        response.setPatientId(1L);
        response.setPatientNom("Doe");
        response.setPatientPrenom("Jane");
        response.setMedecinId(2L);
        response.setMedecinNom("House");
        response.setMedecinPrenom("Gregory");
        return response;
    }
}
