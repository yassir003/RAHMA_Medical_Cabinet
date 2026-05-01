package com.cabinet.medical.soap;

import com.cabinet.medical.entity.Patient;
import com.cabinet.medical.exception.ResourceNotFoundException;
import com.cabinet.medical.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;

import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlRootElement;

@Endpoint
@RequiredArgsConstructor
public class PatientEndpoint {

    private static final String NS = "http://cabinet.medical.com/ws";

    private final PatientRepository patientRepository;

    @PayloadRoot(namespace = NS, localPart = "GetPatientByCinRequest")
    @ResponsePayload
    public GetPatientByCinResponse getPatientByCin(@RequestPayload GetPatientByCinRequest request) {
        Patient patient = patientRepository.findByCin(request.getCin())
            .orElseThrow(() -> new ResourceNotFoundException("Patient non trouvé avec CIN: " + request.getCin()));
        GetPatientByCinResponse response = new GetPatientByCinResponse();
        response.setId(patient.getId());
        response.setNom(patient.getNom());
        response.setPrenom(patient.getPrenom());
        response.setCin(patient.getCin());
        response.setTelephone(patient.getTelephone());
        response.setAdresse(patient.getAdresse());
        return response;
    }

    @PayloadRoot(namespace = NS, localPart = "CreatePatientRequest")
    @ResponsePayload
    public CreatePatientResponse createPatient(@RequestPayload CreatePatientRequest request) {
        Patient patient = Patient.builder()
            .nom(request.getNom())
            .prenom(request.getPrenom())
            .cin(request.getCin())
            .telephone(request.getTelephone())
            .adresse(request.getAdresse())
            .build();
        Patient saved = patientRepository.save(patient);
        CreatePatientResponse response = new CreatePatientResponse();
        response.setId(saved.getId());
        response.setSuccess(true);
        response.setMessage("Patient créé avec succès");
        return response;
    }

    @XmlRootElement(namespace = NS, name = "GetPatientByCinRequest")
    public static class GetPatientByCinRequest {
        private String cin;
        @XmlElement public String getCin() { return cin; }
        public void setCin(String cin) { this.cin = cin; }
    }

    @XmlRootElement(namespace = NS, name = "GetPatientByCinResponse")
    public static class GetPatientByCinResponse {
        private Long id; private String nom; private String prenom;
        private String cin; private String telephone; private String adresse;
        @XmlElement public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        @XmlElement public String getNom() { return nom; }
        public void setNom(String nom) { this.nom = nom; }
        @XmlElement public String getPrenom() { return prenom; }
        public void setPrenom(String prenom) { this.prenom = prenom; }
        @XmlElement public String getCin() { return cin; }
        public void setCin(String cin) { this.cin = cin; }
        @XmlElement public String getTelephone() { return telephone; }
        public void setTelephone(String telephone) { this.telephone = telephone; }
        @XmlElement public String getAdresse() { return adresse; }
        public void setAdresse(String adresse) { this.adresse = adresse; }
    }

    @XmlRootElement(namespace = NS, name = "CreatePatientRequest")
    public static class CreatePatientRequest {
        private String nom; private String prenom; private String cin;
        private String telephone; private String adresse;
        @XmlElement public String getNom() { return nom; }
        public void setNom(String nom) { this.nom = nom; }
        @XmlElement public String getPrenom() { return prenom; }
        public void setPrenom(String prenom) { this.prenom = prenom; }
        @XmlElement public String getCin() { return cin; }
        public void setCin(String cin) { this.cin = cin; }
        @XmlElement public String getTelephone() { return telephone; }
        public void setTelephone(String telephone) { this.telephone = telephone; }
        @XmlElement public String getAdresse() { return adresse; }
        public void setAdresse(String adresse) { this.adresse = adresse; }
    }

    @XmlRootElement(namespace = NS, name = "CreatePatientResponse")
    public static class CreatePatientResponse {
        private Long id; private boolean success; private String message;
        @XmlElement public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        @XmlElement public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        @XmlElement public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}
