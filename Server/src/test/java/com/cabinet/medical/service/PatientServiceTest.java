package com.cabinet.medical.service;

import com.cabinet.medical.dto.request.PatientRequest;
import com.cabinet.medical.dto.response.PatientResponse;
import com.cabinet.medical.entity.Medecin;
import com.cabinet.medical.entity.Patient;
import com.cabinet.medical.entity.User;
import com.cabinet.medical.enums.Role;
import com.cabinet.medical.exception.RegistrationException;
import com.cabinet.medical.exception.ResourceNotFoundException;
import com.cabinet.medical.mapper.PatientMapper;
import com.cabinet.medical.messaging.producer.NotificationProducer;
import com.cabinet.medical.repository.MedecinRepository;
import com.cabinet.medical.repository.PatientRepository;
import com.cabinet.medical.repository.UserRepository;
import com.cabinet.medical.support.TestDataFactory;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PatientServiceTest {

    @Mock
    private PatientRepository patientRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private MedecinRepository medecinRepository;
    @Mock
    private PatientMapper patientMapper;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private NotificationProducer notificationProducer;

    @InjectMocks
    private PatientService patientService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldCreatePatient() {
        PatientRequest request = TestDataFactory.patientRequest();
        Patient savedPatient = TestDataFactory.patient(1L);
        PatientResponse expected = TestDataFactory.patientResponse(1L);

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(patientRepository.findByCin(request.getCin())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(request.getCin())).thenReturn("encoded-cin");
        when(patientRepository.save(any(Patient.class))).thenReturn(savedPatient);
        when(patientMapper.toResponse(savedPatient)).thenReturn(expected);

        PatientResponse response = patientService.create(request);

        assertThat(response.getId()).isEqualTo(1L);
        verify(userRepository).save(any(User.class));
        verify(notificationProducer).envoyerNotification(eq(savedPatient), any(String.class));
    }

    @Test
    void shouldThrowExceptionWhenCreatingPatientWithoutEmail() {
        PatientRequest request = TestDataFactory.patientRequest();
        request.setEmail(" ");

        assertThatThrownBy(() -> patientService.create(request))
            .isInstanceOf(RegistrationException.class)
            .hasMessageContaining("email du patient est obligatoire");
    }

    @Test
    void shouldReturnPatientById() {
        Patient patient = TestDataFactory.patient(1L);
        PatientResponse expected = TestDataFactory.patientResponse(1L);
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(patientMapper.toResponse(patient)).thenReturn(expected);

        PatientResponse response = patientService.getById(1L);

        assertThat(response.getId()).isEqualTo(1L);
    }

    @Test
    void shouldThrowExceptionWhenPatientNotFound() {
        when(patientRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> patientService.getById(99L))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("Patient");
    }

    @Test
    void shouldRestrictPatientFromReadingAnotherProfile() {
        Patient requestedPatient = TestDataFactory.patient(2L);
        Patient currentPatient = TestDataFactory.patient(1L);
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(currentPatient.getUser().getEmail(), null, currentPatient.getUser().getAuthorities()));

        when(patientRepository.findById(2L)).thenReturn(Optional.of(requestedPatient));
        when(patientRepository.findByUser_Email(currentPatient.getUser().getEmail())).thenReturn(Optional.of(currentPatient));

        assertThatThrownBy(() -> patientService.getById(2L))
            .isInstanceOf(org.springframework.security.access.AccessDeniedException.class)
            .hasMessageContaining("propre fiche");
    }

    @Test
    void shouldUpdateCurrentPatientProfile() {
        Patient patient = TestDataFactory.patient(1L);
        PatientRequest request = TestDataFactory.patientRequest();
        PatientResponse expected = TestDataFactory.patientResponse(1L);

        when(patientRepository.findByUser_Email(patient.getUser().getEmail())).thenReturn(Optional.of(patient));
        when(patientRepository.save(patient)).thenReturn(patient);
        when(patientMapper.toResponse(patient)).thenReturn(expected);

        PatientResponse response = patientService.updateMe(patient.getUser().getEmail(), request);

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(patient.getTelephone()).isEqualTo(request.getTelephone());
        verify(patientRepository).save(patient);
    }

    @Test
    void shouldReturnMyPatientsForMedecin() {
        User user = TestDataFactory.user(10L, "doctor@mail.com", Role.MEDECIN);
        Medecin medecin = TestDataFactory.medecin(3L);
        Patient patient = TestDataFactory.patient(1L);
        PatientResponse expected = TestDataFactory.patientResponse(1L);

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(medecinRepository.findByUserId(user.getId())).thenReturn(Optional.of(medecin));
        when(patientRepository.findPatientsByMedecinId(eq(medecin.getId()), eq("Doe"), any()))
            .thenReturn(new PageImpl<>(List.of(patient), PageRequest.of(0, 10), 1));
        when(patientMapper.toResponse(patient)).thenReturn(expected);

        var result = patientService.getMyPatients(user.getEmail(), "Doe", PageRequest.of(0, 10));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getNom()).isEqualTo("Doe");
    }
}
