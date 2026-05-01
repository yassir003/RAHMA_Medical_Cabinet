package com.cabinet.medical.dto.response;

import lombok.Data;
import java.time.LocalDate;

@Data
public class PatientResponse {
    private Long id;
    private String nom;
    private String prenom;
    private String cin;
    private LocalDate dateNaissance;
    private String telephone;
    private String adresse;
    private String groupeSanguin;
    private String allergies;
    private String antecedents;
    private String email;
}
