package com.cabinet.medical.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.LocalDate;

@Data
public class PatientRequest {
    @NotBlank private String nom;
    @NotBlank private String prenom;
    @NotBlank private String cin;
    private LocalDate dateNaissance;
    private String telephone;
    private String adresse;
    private String groupeSanguin;
    private String allergies;
    private String antecedents;
    private String email;
    private String password;
}
