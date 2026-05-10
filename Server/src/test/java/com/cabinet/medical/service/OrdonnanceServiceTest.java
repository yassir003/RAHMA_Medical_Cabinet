package com.cabinet.medical.service;

import com.cabinet.medical.dto.request.OrdonnanceRequest;
import com.cabinet.medical.dto.response.ConsultationSummary;
import com.cabinet.medical.dto.response.MedecinSummary;
import com.cabinet.medical.dto.response.OrdonnanceResponse;
import com.cabinet.medical.dto.response.PatientSummary;
import com.cabinet.medical.entity.Consultation;
import com.cabinet.medical.entity.Medecin;
import com.cabinet.medical.entity.Ordonnance;
import com.cabinet.medical.entity.Patient;
import com.cabinet.medical.enums.Role;
import com.cabinet.medical.enums.StatutOrdonnance;
import com.cabinet.medical.mapper.OrdonnanceMapper;
import com.cabinet.medical.messaging.producer.AuditEventProducer;
import com.cabinet.medical.repository.ConsultationRepository;
import com.cabinet.medical.repository.OrdonnanceRepository;
import com.cabinet.medical.support.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrdonnanceServiceTest {

    @Mock
    private OrdonnanceRepository ordonnanceRepository;
    @Mock
    private ConsultationRepository consultationRepository;
    @Mock
    private OrdonnanceMapper ordonnanceMapper;
    @Mock
    private AuditEventProducer auditEventProducer;

    @InjectMocks
    private OrdonnanceService ordonnanceService;

    @Test
    void shouldCreateOrdonnance() {
        OrdonnanceRequest request = TestDataFactory.ordonnanceRequest();
        Patient patient = TestDataFactory.patient(1L);
        Medecin medecin = TestDataFactory.medecin(2L);
        Consultation consultation = TestDataFactory.consultation(3L, patient, medecin, null);
        Ordonnance ordonnance = Ordonnance.builder()
            .id(4L)
            .consultation(consultation)
            .patient(patient)
            .medecin(medecin)
            .dateCreation(LocalDateTime.now())
            .dureeTraitement(request.getDureeTraitement())
            .instructions(request.getInstructions())
            .statut(StatutOrdonnance.ACTIVE)
            .build();
        OrdonnanceResponse expected = ordonnanceResponse(4L);

        when(consultationRepository.findById(request.getConsultationId())).thenReturn(Optional.of(consultation));
        when(ordonnanceRepository.findByConsultationId(request.getConsultationId())).thenReturn(Optional.empty());
        when(ordonnanceRepository.save(any(Ordonnance.class))).thenReturn(ordonnance);
        when(ordonnanceMapper.toResponse(ordonnance)).thenReturn(expected);

        OrdonnanceResponse response = ordonnanceService.create(request, medecin.getUser().getEmail());

        assertThat(response.getId()).isEqualTo(4L);
        verify(auditEventProducer).publierEvenementAudit("CREATE", "Ordonnance", ordonnance.getId());
    }

    @Test
    void shouldThrowExceptionWhenDoctorCreatesOrdonnanceForForeignConsultation() {
        OrdonnanceRequest request = TestDataFactory.ordonnanceRequest();
        Consultation consultation = TestDataFactory.consultation(3L, TestDataFactory.patient(1L), TestDataFactory.medecin(2L), null);

        when(consultationRepository.findById(request.getConsultationId())).thenReturn(Optional.of(consultation));

        assertThatThrownBy(() -> ordonnanceService.create(request, "other-doctor@mail.com"))
            .isInstanceOf(org.springframework.security.access.AccessDeniedException.class)
            .hasMessageContaining("propres consultations");
    }

    @Test
    void shouldReturnOrdonnanceByIdForPatient() {
        Ordonnance ordonnance = ordonnanceEntity(4L, TestDataFactory.patient(1L), TestDataFactory.medecin(2L));
        OrdonnanceResponse expected = ordonnanceResponse(4L);

        when(ordonnanceRepository.findById(4L)).thenReturn(Optional.of(ordonnance));
        when(ordonnanceMapper.toResponse(ordonnance)).thenReturn(expected);

        OrdonnanceResponse response = ordonnanceService.getByIdForRole(4L, ordonnance.getPatient().getUser().getEmail(), Role.PATIENT);

        assertThat(response.getId()).isEqualTo(4L);
    }

    @Test
    void shouldFilterOrdonnancesBySearchForAdmin() {
        Ordonnance ordonnance = ordonnanceEntity(4L, TestDataFactory.patient(1L), TestDataFactory.medecin(2L));
        OrdonnanceResponse expected = ordonnanceResponse(4L);

        when(ordonnanceRepository.findAll(PageRequest.of(0, 10))).thenReturn(new PageImpl<>(List.of(ordonnance)));
        when(ordonnanceMapper.toResponse(ordonnance)).thenReturn(expected);

        var page = ordonnanceService.getForRole("admin@mail.com", Role.ADMIN, null, "Doe", PageRequest.of(0, 10));

        assertThat(page.getContent()).hasSize(1);
    }

    @Test
    void shouldCancelOrdonnance() {
        Ordonnance ordonnance = ordonnanceEntity(4L, TestDataFactory.patient(1L), TestDataFactory.medecin(2L));
        OrdonnanceResponse expected = ordonnanceResponse(4L);

        when(ordonnanceRepository.findById(4L)).thenReturn(Optional.of(ordonnance));
        when(ordonnanceRepository.save(ordonnance)).thenReturn(ordonnance);
        when(ordonnanceMapper.toResponse(ordonnance)).thenReturn(expected);

        OrdonnanceResponse response = ordonnanceService.annuler(4L, ordonnance.getMedecin().getUser().getEmail());

        assertThat(ordonnance.getStatut()).isEqualTo(StatutOrdonnance.ANNULEE);
        assertThat(response.getId()).isEqualTo(4L);
        verify(auditEventProducer).publierEvenementAudit("ANNULER", "Ordonnance", 4L);
    }

    private Ordonnance ordonnanceEntity(Long id, Patient patient, Medecin medecin) {
        return Ordonnance.builder()
            .id(id)
            .patient(patient)
            .medecin(medecin)
            .consultation(TestDataFactory.consultation(3L, patient, medecin, null))
            .dateCreation(LocalDateTime.of(2026, 5, 12, 12, 0))
            .dureeTraitement("5 jours")
            .instructions("Instructions")
            .statut(StatutOrdonnance.ACTIVE)
            .build();
    }

    private OrdonnanceResponse ordonnanceResponse(Long id) {
        return OrdonnanceResponse.builder()
            .id(id)
            .dateCreation(LocalDateTime.of(2026, 5, 12, 12, 0))
            .dureeTraitement("5 jours")
            .instructions("Instructions")
            .statut(StatutOrdonnance.ACTIVE)
            .consultation(ConsultationSummary.builder().id(3L).motif("Suivi").build())
            .medecin(MedecinSummary.builder().id(2L).nom("House").prenom("Gregory").build())
            .patient(PatientSummary.builder().id(1L).nom("Doe").prenom("Jane").build())
            .build();
    }
}
