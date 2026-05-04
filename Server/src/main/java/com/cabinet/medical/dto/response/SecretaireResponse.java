package com.cabinet.medical.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SecretaireResponse {
    private Long id;
    private String nom;
    private String prenom;
    private String telephone;
    private String email;
}
