package com.cabinet.medical.dto.response;

import com.cabinet.medical.enums.StatutRdv;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class RendezVousResponse {
    private Long id;
    private LocalDateTime dateHeure;
    private String motif;
    private String notes;
    private StatutRdv statut;
    private Long patientId;
    private String patientNom;
    private String patientPrenom;
    private Long medecinId;
    private String medecinNom;
    private String medecinPrenom;
    private String medecinSpecialite;
}
