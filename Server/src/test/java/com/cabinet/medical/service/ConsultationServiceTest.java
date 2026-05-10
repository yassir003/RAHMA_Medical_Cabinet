package com.cabinet.medical.service;

import com.cabinet.medical.dto.request.ConsultationRequest;
import com.cabinet.medical.dto.response.ConsultationResponse;
import com.cabinet.medical.entity.Consultation;
import com.cabinet.medical.entity.Medecin;
import com.cabinet.medical.entity.Patient;
import com.cabinet.medical.entity.RendezVous;
import com.cabinet.medical.entity.User;
import com.cabinet.medical.enums.Role;
import com.cabinet.medical.mapper.ConsultationMapper;
import com.cabinet.medical.messaging.producer.AuditEventProducer;
import com.cabinet.medical.repository.ConsultationRepository;
import com.cabinet.medical.repository.MedecinRepository;
import com.cabinet.medical.repository.PatientRepository;
import com.cabinet.medical.repository.RendezVousRepository;
import com.cabinet.medical.repository.UserRepository;
import com.cabinet.medical.support.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConsultationServiceTest {

    @Mock
    private ConsultationRepository consultationRepository;
    @Mock
    private PatientRepository patientRepository;
    @Mock
    private MedecinRepository medecinRepository;
    @Mock
    private RendezVousRepository rendezVousRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ConsultationMapper consultationMapper;
    @Mock
    private AuditEventProducer auditEventProducer;

    @InjectMocks
    private ConsultationService consultationService;

    @Test
    void shouldCreateConsultation() {
        ConsultationRequest request = TestDataFactory.consultationRequest();
        Patient patient = TestDataFactory.patient(1L);
        Medecin medecin = TestDataFactory.medecin(2L);
        RendezVous rendezVous = TestDataFactory.rendezVous(3L, patient, medecin);
        Consultation consultation = TestDataFactory.consultation(4L, patient, medecin, rendezVous);
        ConsultationResponse expected = TestDataFactory.consultationResponse(4L);

        when(patientRepository.findById(request.getPatientId())).thenReturn(Optional.of(patient));
        when(medecinRepository.findById(request.getMedecinId())).thenReturn(Optional.of(medecin));
        when(rendezVousRepository.findById(request.getRendezVousId())).thenReturn(Optional.of(rendezVous));
        when(consultationRepository.save(any(Consultation.class))).thenReturn(consultation);
        when(consultationMapper.toResponse(consultation)).thenReturn(expected);

        ConsultationResponse response = consultationService.create(request);

        assertThat(response.getId()).isEqualTo(4L);
        verify(auditEventProducer).publierEvenementAudit("CREATE", "Consultation", consultation.getId());
    }

    @Test
    void shouldReturnConsultationWithDoctorFieldsForDoctorRole() {
        Patient patient = TestDataFactory.patient(1L);
        Consultation consultation = TestDataFactory.consultation(4L, patient, TestDataFactory.medecin(2L), null);
        ConsultationResponse expected = TestDataFactory.consultationResponse(4L);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
            "doctor@mail.com", null, List.of(() -> "ROLE_MEDECIN"));

        when(consultationRepository.findById(4L)).thenReturn(Optional.of(consultation));
        when(consultationMapper.toResponse(consultation)).thenReturn(expected);

        ConsultationResponse response = consultationService.getByIdForRole(4L, auth);

        assertThat(response.getDiagnostic()).isEqualTo("Diagnostic");
        assertThat(response.getNotes()).isEqualTo("Notes");
    }

    @Test
    void shouldHideSensitiveFieldsForSecretaryRole() {
        Patient patient = TestDataFactory.patient(1L);
        Consultation consultation = TestDataFactory.consultation(4L, patient, TestDataFactory.medecin(2L), null);
        ConsultationResponse expected = TestDataFactory.consultationResponse(4L);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
            "secretary@mail.com", null, List.of(() -> "ROLE_SECRETAIRE"));

        when(consultationRepository.findById(4L)).thenReturn(Optional.of(consultation));
        when(consultationMapper.toResponse(consultation)).thenReturn(expected);

        ConsultationResponse response = consultationService.getByIdForRole(4L, auth);

        assertThat(response.getDiagnostic()).isNull();
        assertThat(response.getDiagnosticPatient()).isNull();
        assertThat(response.getNotes()).isNull();
    }

    @Test
    void shouldThrowExceptionWhenPatientAccessesAnotherConsultation() {
        Patient owner = TestDataFactory.patient(1L);
        Consultation consultation = TestDataFactory.consultation(4L, owner, TestDataFactory.medecin(2L), null);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
            "other@mail.com", null, List.of(() -> "ROLE_PATIENT"));

        when(consultationRepository.findById(4L)).thenReturn(Optional.of(consultation));

        assertThatThrownBy(() -> consultationService.getByIdForRole(4L, auth))
            .isInstanceOf(org.springframework.security.access.AccessDeniedException.class)
            .hasMessageContaining("autorisé");
    }

    @Test
    void shouldReturnDoctorConsultationsByEmail() {
        User user = TestDataFactory.user(11L, "doctor@mail.com", Role.MEDECIN);
        Medecin medecin = TestDataFactory.medecin(2L);
        Consultation consultation = TestDataFactory.consultation(4L, TestDataFactory.patient(1L), medecin, null);
        ConsultationResponse expected = TestDataFactory.consultationResponse(4L);

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(medecinRepository.findByUserId(user.getId())).thenReturn(Optional.of(medecin));
        when(consultationRepository.findByMedecinId(medecin.getId(), org.springframework.data.domain.PageRequest.of(0, 10)))
            .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(consultation)));
        when(consultationMapper.toResponse(consultation)).thenReturn(expected);

        var page = consultationService.getByMedecinEmail(user.getEmail(), org.springframework.data.domain.PageRequest.of(0, 10));

        assertThat(page.getContent()).hasSize(1);
    }
}
