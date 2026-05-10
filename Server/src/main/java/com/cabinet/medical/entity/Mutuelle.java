package com.cabinet.medical.entity;

import com.cabinet.medical.enums.TypeMutuelle;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "mutuelles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mutuelle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private TypeMutuelle type;

    private String numeroAffiliation;
    private String organismeNom;
    private LocalDate dateAffiliation;
    private Long immatriculation;
    private Long somEtabPens;

    @OneToOne
    @JoinColumn(name = "patient_id")
    private Patient patient;
}
