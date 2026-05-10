package com.cabinet.medical.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LigneMedicamentResponse {
    private Long id;
    private String nomMedicament;
    private String dosage;
    private String frequence;
    private String duree;
    private String instructions;
}
