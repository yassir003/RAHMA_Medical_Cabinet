package com.cabinet.medical.dto.response;

import com.cabinet.medical.enums.StatutDossier;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class DossierRemboursementResponse {
    private Long id;
    private LocalDateTime dateCreation;
    private LocalDateTime dateEnvoi;
    private StatutDossier statut;
    private Long patientId;
    private String patientNom;
    private String patientPrenom;
    private Long mutuelleId;
    private String mutuelleOrganisme;
    private LocalDate mutuelleDateAffiliation;
    private Long mutuelleImmatriculation;
    private Long mutuelleSomEtabPens;
    private Long consultationId;
    private String documentJustificatif;
}
