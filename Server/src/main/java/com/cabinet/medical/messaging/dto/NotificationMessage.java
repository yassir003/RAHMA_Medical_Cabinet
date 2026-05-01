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
public class NotificationMessage implements Serializable {
    private Long rdvId;
    private String patientEmail;
    private String patientNom;
    private String medecinNom;
    private String dateHeure;
    private String motif;
    private String type;
}
