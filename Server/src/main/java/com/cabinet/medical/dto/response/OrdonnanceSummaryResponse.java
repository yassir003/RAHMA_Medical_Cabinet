package com.cabinet.medical.dto.response;

import com.cabinet.medical.enums.StatutOrdonnance;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrdonnanceSummaryResponse {
    private Long id;
    private String dureeTraitement;
    private StatutOrdonnance statut;
    private List<LigneMedicamentResponse> medicaments;
}
