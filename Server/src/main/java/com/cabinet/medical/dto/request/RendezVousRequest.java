package com.cabinet.medical.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class RendezVousRequest {
    @NotNull private LocalDateTime dateHeure;
    private String motif;
    private String notes;
    @NotNull private Long patientId;
    @NotNull private Long medecinId;
}
