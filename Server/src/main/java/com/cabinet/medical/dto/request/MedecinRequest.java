package com.cabinet.medical.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MedecinRequest {
    @NotBlank private String nom;
    @NotBlank private String prenom;
    @NotBlank private String specialite;
    private String telephone;
    @NotBlank private String email;
    @NotBlank private String password;
}
