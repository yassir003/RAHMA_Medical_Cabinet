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
public class AlertMessage implements Serializable {
    private String subject;
    private String body;
    private String recipient;
    private String type;
}
