package com.cabinet.medical.exception;

public class PatientNotFoundException extends ResourceNotFoundException {
    public PatientNotFoundException(Long id) {
        super("Patient non trouvé avec l'id: " + id);
    }
}
