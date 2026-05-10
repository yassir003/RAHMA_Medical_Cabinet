package com.cabinet.medical.entity;

import com.cabinet.medical.enums.StatutDossier;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "dossiers_remboursement")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DossierRemboursement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime dateCreation;
    private LocalDateTime dateEnvoi;

    @Enumerated(EnumType.STRING)
    private StatutDossier statut = StatutDossier.EN_ATTENTE;

    @ManyToOne
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "mutuelle_id")
    private Mutuelle mutuelle;

    @ManyToOne
    @JoinColumn(name = "consultation_id")
    private Consultation consultation;

    private String documentJustificatif;
}
