package com.cabinet.medical.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SecretaireUpdateRequest {
    @NotBlank private String nom;
    @NotBlank private String prenom;
    private String telephone;
    @NotBlank private String email;
}
