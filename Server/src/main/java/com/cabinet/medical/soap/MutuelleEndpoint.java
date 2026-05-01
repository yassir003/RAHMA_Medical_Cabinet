package com.cabinet.medical.soap;

import com.cabinet.medical.dto.request.DossierRemboursementRequest;
import com.cabinet.medical.entity.Mutuelle;
import com.cabinet.medical.repository.MutuelleRepository;
import com.cabinet.medical.service.DossierRemboursementService;
import lombok.RequiredArgsConstructor;
import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;

import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlRootElement;
import java.time.LocalDate;
import java.util.Optional;

@Endpoint
@RequiredArgsConstructor
public class MutuelleEndpoint {

    private static final String NS = "http://cabinet.medical.com/ws";

    private final MutuelleRepository mutuelleRepository;
    private final DossierRemboursementService dossierService;

    @PayloadRoot(namespace = NS, localPart = "VerifierCouvertureRequest")
    @ResponsePayload
    public VerifierCouvertureResponse verifierCouverture(@RequestPayload VerifierCouvertureRequest request) {
        Optional<Mutuelle> opt = mutuelleRepository.findByPatientId(request.getPatientId());
        VerifierCouvertureResponse response = new VerifierCouvertureResponse();
        if (opt.isPresent()) {
            Mutuelle m = opt.get();
            boolean valide = m.getDateFin() == null || m.getDateFin().isAfter(LocalDate.now());
            response.setCouvert(valide);
            response.setTypeMutuelle(m.getType() != null ? m.getType().name() : "");
            response.setTauxRemboursement(m.getTauxRemboursement() != null ? m.getTauxRemboursement() : 0.0);
            response.setDateExpiration(m.getDateFin() != null ? m.getDateFin().toString() : "");
        } else {
            response.setCouvert(false);
        }
        return response;
    }

    @PayloadRoot(namespace = NS, localPart = "DemandeRemboursementRequest")
    @ResponsePayload
    public DemandeRemboursementResponse demandeRemboursement(@RequestPayload DemandeRemboursementSoapRequest request) {
        DemandeRemboursementResponse response = new DemandeRemboursementResponse();
        try {
            DossierRemboursementRequest req = new DossierRemboursementRequest();
            req.setPatientId(request.getPatientId());
            req.setConsultationId(request.getConsultationId());
            req.setMutuelleId(request.getMutuelleId());
            var dossier = dossierService.createDossier(req);
            response.setDossierId(dossier.getId());
            response.setSuccess(true);
            response.setMessage("Dossier créé avec succès");
            response.setMontantRembourse(dossier.getMontantRembourse() != null
                ? dossier.getMontantRembourse().doubleValue() : 0.0);
        } catch (Exception e) {
            response.setSuccess(false);
            response.setMessage(e.getMessage());
        }
        return response;
    }

    @XmlRootElement(namespace = NS, name = "VerifierCouvertureRequest")
    public static class VerifierCouvertureRequest {
        private Long patientId;
        @XmlElement public Long getPatientId() { return patientId; }
        public void setPatientId(Long patientId) { this.patientId = patientId; }
    }

    @XmlRootElement(namespace = NS, name = "VerifierCouvertureResponse")
    public static class VerifierCouvertureResponse {
        private boolean couvert; private String typeMutuelle;
        private double tauxRemboursement; private String dateExpiration;
        @XmlElement public boolean isCouvert() { return couvert; }
        public void setCouvert(boolean couvert) { this.couvert = couvert; }
        @XmlElement public String getTypeMutuelle() { return typeMutuelle; }
        public void setTypeMutuelle(String t) { this.typeMutuelle = t; }
        @XmlElement public double getTauxRemboursement() { return tauxRemboursement; }
        public void setTauxRemboursement(double t) { this.tauxRemboursement = t; }
        @XmlElement public String getDateExpiration() { return dateExpiration; }
        public void setDateExpiration(String d) { this.dateExpiration = d; }
    }

    @XmlRootElement(namespace = NS, name = "DemandeRemboursementRequest")
    public static class DemandeRemboursementSoapRequest {
        private Long patientId; private Long consultationId; private Long mutuelleId;
        @XmlElement public Long getPatientId() { return patientId; }
        public void setPatientId(Long p) { this.patientId = p; }
        @XmlElement public Long getConsultationId() { return consultationId; }
        public void setConsultationId(Long c) { this.consultationId = c; }
        @XmlElement public Long getMutuelleId() { return mutuelleId; }
        public void setMutuelleId(Long m) { this.mutuelleId = m; }
    }

    @XmlRootElement(namespace = NS, name = "DemandeRemboursementResponse")
    public static class DemandeRemboursementResponse {
        private Long dossierId; private boolean success; private String message; private double montantRembourse;
        @XmlElement public Long getDossierId() { return dossierId; }
        public void setDossierId(Long d) { this.dossierId = d; }
        @XmlElement public boolean isSuccess() { return success; }
        public void setSuccess(boolean s) { this.success = s; }
        @XmlElement public String getMessage() { return message; }
        public void setMessage(String m) { this.message = m; }
        @XmlElement public double getMontantRembourse() { return montantRembourse; }
        public void setMontantRembourse(double m) { this.montantRembourse = m; }
    }
}
