package com.cabinet.medical.dto.request;

import com.cabinet.medical.enums.TypeMutuelle;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class MutuelleRequest {
    @NotNull private TypeMutuelle type;
    private String numeroAffiliation;
    private String organismeNom;
    private LocalDate dateAffiliation;
    @Min(100000000)
    @Max(999999999)
    private Long immatriculation;
    @Min(0)
    private Long somEtabPens;
    @NotNull private Long patientId;
}
