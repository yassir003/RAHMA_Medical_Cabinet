package com.cabinet.medical.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DossierRemboursementRequest {
    @NotNull private Long patientId;
    @NotNull private Long mutuelleId;
    @NotNull private Long consultationId;
    private String documentJustificatif;
}
