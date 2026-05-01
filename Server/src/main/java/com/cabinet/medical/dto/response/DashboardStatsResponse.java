package com.cabinet.medical.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private long totalPatients;
    private long totalMedecins;
    private long totalRendezVous;
    private long totalConsultations;
    private long rdvAujourdhui;
    private long rdvPlanifies;
    private long dossierEnAttente;
    private Map<String, Long> consultationsParMedecin;
    private Map<String, Long> patientsParMutuelle;
}
