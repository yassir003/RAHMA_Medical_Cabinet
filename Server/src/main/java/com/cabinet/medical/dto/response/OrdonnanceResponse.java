package com.cabinet.medical.dto.response;

import com.cabinet.medical.enums.StatutOrdonnance;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrdonnanceResponse {
    private Long id;
    private LocalDateTime dateCreation;
    private String dureeTraitement;
    private String instructions;
    private StatutOrdonnance statut;
    private List<LigneMedicamentResponse> medicaments;
    private ConsultationSummary consultation;
    private MedecinSummary medecin;
    private PatientSummary patient;
}
