package com.cabinet.medical.dto.response;

import com.cabinet.medical.enums.StatutDossier;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class DossierRemboursementResponse {
    private Long id;
    private BigDecimal montantTotal;
    private BigDecimal montantRembourse;
    private LocalDateTime dateCreation;
    private LocalDateTime dateEnvoi;
    private StatutDossier statut;
    private Long patientId;
    private String patientNom;
    private String patientPrenom;
    private Long mutuelleId;
    private String mutuelleOrganisme;
    private Long consultationId;
    private String documentJustificatif;
}
