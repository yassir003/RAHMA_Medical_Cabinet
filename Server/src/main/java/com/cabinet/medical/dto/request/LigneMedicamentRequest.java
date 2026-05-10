package com.cabinet.medical.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LigneMedicamentRequest {
    @NotBlank
    private String nomMedicament;

    @NotBlank
    private String dosage;

    @NotBlank
    private String frequence;

    @NotBlank
    private String duree;

    private String instructions;
}
