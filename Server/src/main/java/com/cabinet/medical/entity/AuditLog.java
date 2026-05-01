package com.cabinet.medical.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String action;
    private String entite;
    private Long entiteId;
    private String utilisateur;
    private LocalDateTime timestamp;

    @Column(columnDefinition = "TEXT")
    private String details;
}
