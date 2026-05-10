package com.cabinet.medical.dto.response;

import com.cabinet.medical.enums.TypeMutuelle;
import lombok.Data;
import java.time.LocalDate;

@Data
public class MutuelleResponse {
    private Long id;
    private TypeMutuelle type;
    private String numeroAffiliation;
    private String organismeNom;
    private LocalDate dateAffiliation;
    private Long immatriculation;
    private Long somEtabPens;
    private Long patientId;
    private String patientNom;
    private String patientPrenom;
}
