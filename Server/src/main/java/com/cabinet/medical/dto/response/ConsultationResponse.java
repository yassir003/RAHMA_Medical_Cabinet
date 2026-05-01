package com.cabinet.medical.dto.response;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ConsultationResponse {
    private Long id;
    private LocalDateTime dateVisite;
    private String motif;
    private String diagnostic;
    private String notes;
    private String actesRealises;
    private BigDecimal montantTotal;
    private Long patientId;
    private String patientNom;
    private String patientPrenom;
    private Long medecinId;
    private String medecinNom;
    private String medecinPrenom;
    private Long rendezVousId;
}
