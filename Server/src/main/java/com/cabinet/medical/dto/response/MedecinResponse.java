package com.cabinet.medical.dto.response;

import lombok.Data;

@Data
public class MedecinResponse {
    private Long id;
    private String nom;
    private String prenom;
    private String specialite;
    private String telephone;
    private String email;
}
