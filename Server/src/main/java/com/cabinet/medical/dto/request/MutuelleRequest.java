package com.cabinet.medical.dto.request;

import com.cabinet.medical.enums.TypeMutuelle;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class MutuelleRequest {
    @NotNull private TypeMutuelle type;
    private String numeroAffiliation;
    private String organismeNom;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private Double tauxRemboursement;
    @NotNull private Long patientId;
}
