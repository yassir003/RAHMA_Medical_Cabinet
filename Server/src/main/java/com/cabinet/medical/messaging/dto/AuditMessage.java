package com.cabinet.medical.messaging.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditMessage implements Serializable {
    private String action;
    private String entite;
    private Long entiteId;
    private String utilisateur;
    private String details;
}
