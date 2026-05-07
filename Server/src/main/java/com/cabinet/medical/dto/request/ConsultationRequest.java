package com.cabinet.medical.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ConsultationRequest {
    @NotNull private LocalDateTime dateVisite;
    private String motif;
    private String diagnostic;
    private String diagnosticPatient;
    private String notes;
    private String actesRealises;
    private BigDecimal montantTotal;
    @NotNull private Long patientId;
    @NotNull private Long medecinId;
    private Long rendezVousId;
}
