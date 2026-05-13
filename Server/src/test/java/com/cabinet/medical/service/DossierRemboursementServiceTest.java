package com.cabinet.medical.service;

import com.cabinet.medical.dto.request.DossierRemboursementRequest;
import com.cabinet.medical.dto.response.DossierRemboursementResponse;
import com.cabinet.medical.entity.Consultation;
import com.cabinet.medical.entity.DossierRemboursement;
import com.cabinet.medical.entity.Medecin;
import com.cabinet.medical.entity.Mutuelle;
import com.cabinet.medical.entity.Patient;
import com.cabinet.medical.enums.StatutDossier;
import com.cabinet.medical.enums.TypeMutuelle;
import com.cabinet.medical.exception.ResourceNotFoundException;
import com.cabinet.medical.mapper.DossierRemboursementMapper;
import com.cabinet.medical.messaging.producer.AuditEventProducer;
import com.cabinet.medical.messaging.producer.NotificationProducer;
import com.cabinet.medical.repository.ConsultationRepository;
import com.cabinet.medical.repository.DossierRemboursementRepository;
import com.cabinet.medical.repository.MutuelleRepository;
import com.cabinet.medical.repository.PatientRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("DossierRemboursementService")
class DossierRemboursementServiceTest {

    @Mock
    private DossierRemboursementRepository dossierRepository;
    @Mock
    private PatientRepository patientRepository;
    @Mock
    private MutuelleRepository mutuelleRepository;
    @Mock
    private ConsultationRepository consultationRepository;
    @Mock
    private DossierRemboursementMapper dossierMapper;
    @Mock
    private AuditEventProducer auditEventProducer;
    @Mock
    private NotificationProducer notificationProducer;

    @InjectMocks
    private DossierRemboursementService dossierService;

    @Test
    @DisplayName("should return all reimbursement dossiers when repository has data")
    void shouldReturnAllReimbursementDossiersWhenRepositoryHasData() {
        DossierRemboursement dossier = dossier(1L);
        DossierRemboursementResponse expected = response(1L);
        PageRequest pageable = PageRequest.of(0, 10);

        when(dossierRepository.findAll(pageable)).thenReturn(new PageImpl<>(List.of(dossier), pageable, 1));
        when(dossierMapper.toResponse(dossier)).thenReturn(expected);

        var result = dossierService.getAll(pageable);

        assertThat(result.getContent()).containsExactly(expected);
    }

    @Test
    @DisplayName("should return empty page when fallback is called")
    void shouldReturnEmptyPageWhenFallbackIsCalled() {
        var result = dossierService.dossierFallback(PageRequest.of(0, 10), new RuntimeException("down"));

        assertThat(result.getContent()).isEmpty();
    }

    @Test
    @DisplayName("should create reimbursement dossier when dependencies exist")
    void shouldCreateReimbursementDossierWhenDependenciesExist() {
        Patient patient = patient(1L);
        Mutuelle mutuelle = mutuelle(2L, patient);
        Consultation consultation = consultation(3L, patient, medecin(4L));
        DossierRemboursement saved = dossier(5L);
        DossierRemboursementResponse expected = response(5L);

        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(mutuelleRepository.findById(2L)).thenReturn(Optional.of(mutuelle));
        when(consultationRepository.findById(3L)).thenReturn(Optional.of(consultation));
        when(dossierRepository.save(any(DossierRemboursement.class))).thenReturn(saved);
        when(dossierMapper.toResponse(saved)).thenReturn(expected);

        DossierRemboursementResponse actual = dossierService.createDossier(request());

        assertThat(actual.getId()).isEqualTo(5L);
        verify(auditEventProducer).publierEvenementAudit("CREATE", "DossierRemboursement", 5L);
    }

    @Test
    @DisplayName("should change status and set sent date when status is sent")
    void shouldChangeStatusAndSetSentDateWhenStatusIsSent() {
        DossierRemboursement dossier = dossier(6L);
        DossierRemboursementResponse expected = response(6L);
        expected.setStatut(StatutDossier.ENVOYE);

        when(dossierRepository.findById(6L)).thenReturn(Optional.of(dossier));
        when(dossierRepository.save(dossier)).thenReturn(dossier);
        when(dossierMapper.toResponse(dossier)).thenReturn(expected);

        DossierRemboursementResponse actual = dossierService.changerStatut(6L, StatutDossier.ENVOYE);

        assertThat(actual.getStatut()).isEqualTo(StatutDossier.ENVOYE);
        assertThat(dossier.getDateEnvoi()).isNotNull();
        verify(notificationProducer).envoyerNotification(dossier.getPatient(), "Votre dossier est ENVOYE");
    }

    @Test
    @DisplayName("should return dossiers by patient when patient id matches")
    void shouldReturnDossiersByPatientWhenPatientIdMatches() {
        DossierRemboursement dossier = dossier(7L);
        DossierRemboursementResponse expected = response(7L);
        PageRequest pageable = PageRequest.of(0, 10);

        when(dossierRepository.findByPatientId(1L, pageable)).thenReturn(new PageImpl<>(List.of(dossier), pageable, 1));
        when(dossierMapper.toResponse(dossier)).thenReturn(expected);

        var result = dossierService.getByPatient(1L, pageable);

        assertThat(result.getContent()).containsExactly(expected);
    }

    @Test
    @DisplayName("should throw not found when dossier does not exist")
    void shouldThrowNotFoundWhenDossierDoesNotExist() {
        when(dossierRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> dossierService.getById(99L))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("99");
    }

    private DossierRemboursementRequest request() {
        DossierRemboursementRequest request = new DossierRemboursementRequest();
        request.setPatientId(1L);
        request.setMutuelleId(2L);
        request.setConsultationId(3L);
        request.setDocumentJustificatif("scan.pdf");
        return request;
    }

    private DossierRemboursement dossier(Long id) {
        Patient patient = patient(1L);
        return DossierRemboursement.builder()
            .id(id)
            .patient(patient)
            .mutuelle(mutuelle(2L, patient))
            .consultation(consultation(3L, patient, medecin(4L)))
            .statut(StatutDossier.EN_ATTENTE)
            .documentJustificatif("scan.pdf")
            .build();
    }

    private Patient patient(Long id) {
        return Patient.builder()
            .id(id)
            .nom("Doe")
            .prenom("Jane")
            .cin("CIN-" + id)
            .build();
    }

    private Medecin medecin(Long id) {
        return Medecin.builder()
            .id(id)
            .nom("House")
            .prenom("Gregory")
            .specialite("Cardiology")
            .build();
    }

    private Consultation consultation(Long id, Patient patient, Medecin medecin) {
        return Consultation.builder()
            .id(id)
            .patient(patient)
            .medecin(medecin)
            .motif("Controle")
            .build();
    }

    private Mutuelle mutuelle(Long id, Patient patient) {
        return Mutuelle.builder()
            .id(id)
            .type(TypeMutuelle.CNSS)
            .organismeNom("CNSS")
            .dateAffiliation(LocalDate.of(2024, 1, 15))
            .patient(patient)
            .build();
    }

    private DossierRemboursementResponse response(Long id) {
        DossierRemboursementResponse response = new DossierRemboursementResponse();
        response.setId(id);
        response.setPatientId(1L);
        response.setMutuelleId(2L);
        response.setConsultationId(3L);
        response.setStatut(StatutDossier.EN_ATTENTE);
        response.setDocumentJustificatif("scan.pdf");
        return response;
    }
}
