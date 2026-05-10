package com.cabinet.medical.mapper;

import com.cabinet.medical.dto.response.ConsultationSummary;
import com.cabinet.medical.dto.response.LigneMedicamentResponse;
import com.cabinet.medical.dto.response.MedecinSummary;
import com.cabinet.medical.dto.response.OrdonnanceResponse;
import com.cabinet.medical.dto.response.OrdonnanceSummaryResponse;
import com.cabinet.medical.dto.response.PatientSummary;
import com.cabinet.medical.entity.LigneMedicament;
import com.cabinet.medical.entity.Ordonnance;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class OrdonnanceMapper {

    public OrdonnanceResponse toResponse(Ordonnance ordonnance) {
        if (ordonnance == null) {
            return null;
        }

        return OrdonnanceResponse.builder()
            .id(ordonnance.getId())
            .dateCreation(ordonnance.getDateCreation())
            .dureeTraitement(ordonnance.getDureeTraitement())
            .instructions(ordonnance.getInstructions())
            .statut(ordonnance.getStatut())
            .medicaments(toMedicamentResponses(ordonnance.getMedicaments()))
            .consultation(ConsultationSummary.builder()
                .id(ordonnance.getConsultation() != null ? ordonnance.getConsultation().getId() : null)
                .dateVisite(ordonnance.getConsultation() != null ? ordonnance.getConsultation().getDateVisite() : null)
                .motif(ordonnance.getConsultation() != null ? ordonnance.getConsultation().getMotif() : null)
                .build())
            .medecin(MedecinSummary.builder()
                .id(ordonnance.getMedecin() != null ? ordonnance.getMedecin().getId() : null)
                .nom(ordonnance.getMedecin() != null ? ordonnance.getMedecin().getNom() : null)
                .prenom(ordonnance.getMedecin() != null ? ordonnance.getMedecin().getPrenom() : null)
                .specialite(ordonnance.getMedecin() != null ? ordonnance.getMedecin().getSpecialite() : null)
                .build())
            .patient(PatientSummary.builder()
                .id(ordonnance.getPatient() != null ? ordonnance.getPatient().getId() : null)
                .nom(ordonnance.getPatient() != null ? ordonnance.getPatient().getNom() : null)
                .prenom(ordonnance.getPatient() != null ? ordonnance.getPatient().getPrenom() : null)
                .cin(ordonnance.getPatient() != null ? ordonnance.getPatient().getCin() : null)
                .build())
            .build();
    }

    public OrdonnanceSummaryResponse toSummary(Ordonnance ordonnance) {
        if (ordonnance == null) {
            return null;
        }

        return OrdonnanceSummaryResponse.builder()
            .id(ordonnance.getId())
            .dureeTraitement(ordonnance.getDureeTraitement())
            .statut(ordonnance.getStatut())
            .medicaments(toMedicamentResponses(ordonnance.getMedicaments()))
            .build();
    }

    private List<LigneMedicamentResponse> toMedicamentResponses(List<LigneMedicament> medicaments) {
        if (medicaments == null) {
            return List.of();
        }

        return medicaments.stream()
            .map(this::toMedicamentResponse)
            .toList();
    }

    private LigneMedicamentResponse toMedicamentResponse(LigneMedicament medicament) {
        return LigneMedicamentResponse.builder()
            .id(medicament.getId())
            .nomMedicament(medicament.getNomMedicament())
            .dosage(medicament.getDosage())
            .frequence(medicament.getFrequence())
            .duree(medicament.getDuree())
            .instructions(medicament.getInstructions())
            .build();
    }
}
