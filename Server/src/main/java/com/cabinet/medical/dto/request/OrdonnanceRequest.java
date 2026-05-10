package com.cabinet.medical.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class OrdonnanceRequest {
    @NotNull
    private Long consultationId;

    @NotBlank
    private String dureeTraitement;

    private String instructions;

    @NotEmpty
    @Valid
    private List<LigneMedicamentRequest> medicaments;
}
