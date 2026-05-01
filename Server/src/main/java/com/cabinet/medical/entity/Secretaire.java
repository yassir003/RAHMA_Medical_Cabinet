package com.cabinet.medical.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "secretaires")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Secretaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;
    private String prenom;
    private String telephone;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;
}
