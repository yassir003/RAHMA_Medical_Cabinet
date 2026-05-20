package com.cabinet.medical.service;

import com.cabinet.medical.dto.request.RendezVousRequest;
import com.cabinet.medical.dto.response.RendezVousResponse;
import com.cabinet.medical.entity.Medecin;
import com.cabinet.medical.entity.Patient;
import com.cabinet.medical.entity.RendezVous;
import com.cabinet.medical.entity.User;
import com.cabinet.medical.enums.Role;
import com.cabinet.medical.enums.StatutRdv;
import com.cabinet.medical.exception.ConflitHoraireException;
import com.cabinet.medical.exception.ResourceNotFoundException;
import com.cabinet.medical.mapper.RendezVousMapper;
import com.cabinet.medical.messaging.producer.AuditEventProducer;
import com.cabinet.medical.messaging.producer.DashboardProducer;
import com.cabinet.medical.messaging.producer.NotificationProducer;
import com.cabinet.medical.repository.MedecinRepository;
import com.cabinet.medical.repository.PatientRepository;
import com.cabinet.medical.repository.RendezVousRepository;
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
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RendezVousServiceTest {

    @Mock
    private RendezVousRepository rendezVousRepository;
    @Mock
    private PatientRepository patientRepository;
    @Mock
    private MedecinRepository medecinRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private RendezVousMapper rendezVousMapper;
    @Mock
    private NotificationProducer notificationProducer;
    @Mock
    private AuditEventProducer auditEventProducer;
    @Mock
    private DashboardProducer dashboardProducer;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private RendezVousService rendezVousService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldCreateRendezVous() {
        Patient patient = TestDataFactory.patient(1L);
        Medecin medecin = TestDataFactory.medecin(2L);
        RendezVousRequest request = TestDataFactory.rendezVousRequest();
        RendezVous saved = TestDataFactory.rendezVous(5L, patient, medecin);
        RendezVousResponse expected = TestDataFactory.rendezVousResponse(5L);

        when(rendezVousRepository.existsByMedecinIdAndDateHeureBetweenAndStatutNot(
            request.getMedecinId(), request.getDateHeure(), request.getDateHeure().plusMinutes(30), StatutRdv.ANNULE))
            .thenReturn(false);
        when(patientRepository.findById(request.getPatientId())).thenReturn(Optional.of(patient));
        when(medecinRepository.findById(request.getMedecinId())).thenReturn(Optional.of(medecin));
        when(rendezVousRepository.save(any(RendezVous.class))).thenReturn(saved);
        when(rendezVousMapper.toResponse(saved)).thenReturn(expected);

        RendezVousResponse response = rendezVousService.creerRendezVous(request);

        assertThat(response.getId()).isEqualTo(5L);
        verify(notificationProducer).envoyerNotificationRdv(saved);
        verify(notificationService).notifierRdvPlanifie(saved);
        verify(auditEventProducer).publierEvenementAudit("CREATE", "RendezVous", saved.getId());
        verify(dashboardProducer).notifierMiseAJourDashboard("NEW_RDV");
    }

    @Test
    void shouldThrowExceptionWhenRendezVousConflicts() {
        RendezVousRequest request = TestDataFactory.rendezVousRequest();
        when(rendezVousRepository.existsByMedecinIdAndDateHeureBetweenAndStatutNot(
            request.getMedecinId(), request.getDateHeure(), request.getDateHeure().plusMinutes(30), StatutRdv.ANNULE))
            .thenReturn(true);

        assertThatThrownBy(() -> rendezVousService.creerRendezVous(request))
            .isInstanceOf(ConflitHoraireException.class)
            .hasMessageContaining("déjà un rendez-vous");
    }

    @Test
    void shouldDenyPatientCreatingAppointmentForAnotherPatient() {
        RendezVousRequest request = TestDataFactory.rendezVousRequest();
        Patient otherPatient = TestDataFactory.patient(7L);
        authenticateAsPatient(otherPatient.getUser().getEmail());

        when(patientRepository.findByUser_Email(otherPatient.getUser().getEmail())).thenReturn(Optional.of(otherPatient));

        assertThatThrownBy(() -> rendezVousService.creerRendezVous(request))
            .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);

        verify(rendezVousRepository, never()).save(any(RendezVous.class));
    }

    @Test
    void shouldDenyPatientReadingForeignAppointment() {
        Patient owner = TestDataFactory.patient(1L);
        Patient otherPatient = TestDataFactory.patient(7L);
        RendezVous rdv = TestDataFactory.rendezVous(3L, owner, TestDataFactory.medecin(2L));
        authenticateAsPatient(otherPatient.getUser().getEmail());

        when(rendezVousRepository.findById(3L)).thenReturn(Optional.of(rdv));
        when(patientRepository.findByUser_Email(otherPatient.getUser().getEmail())).thenReturn(Optional.of(otherPatient));

        assertThatThrownBy(() -> rendezVousService.getById(3L))
            .isInstanceOf(org.springframework.security.access.AccessDeniedException.class)
            .hasMessageContaining("ne vous appartient pas");
    }

    @Test
    void shouldThrowExceptionWhenAppointmentDoesNotExist() {
        when(rendezVousRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> rendezVousService.getById(99L))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("Rendez-vous non trouv");
    }

    @Test
    void shouldUpdateRendezVousDetails() {
        Patient patient = TestDataFactory.patient(1L);
        Medecin medecin = TestDataFactory.medecin(2L);
        RendezVous rdv = TestDataFactory.rendezVous(3L, patient, medecin);
        RendezVousRequest request = TestDataFactory.rendezVousRequest();
        request.setMotif("Urgence");
        request.setNotes("Nouvelles notes");
        request.setDateHeure(LocalDateTime.of(2026, 5, 13, 14, 30));
        RendezVousResponse expected = TestDataFactory.rendezVousResponse(3L);

        when(rendezVousRepository.findById(3L)).thenReturn(Optional.of(rdv));
        when(rendezVousRepository.save(rdv)).thenReturn(rdv);
        when(rendezVousMapper.toResponse(rdv)).thenReturn(expected);

        RendezVousResponse response = rendezVousService.update(3L, request);

        assertThat(response.getId()).isEqualTo(3L);
        assertThat(rdv.getMotif()).isEqualTo("Urgence");
        assertThat(rdv.getNotes()).isEqualTo("Nouvelles notes");
        assertThat(rdv.getDateHeure()).isEqualTo(LocalDateTime.of(2026, 5, 13, 14, 30));
    }

    @Test
    void shouldConfirmRendezVousAndNotifyPatient() {
        RendezVous rdv = TestDataFactory.rendezVous(3L, TestDataFactory.patient(1L), TestDataFactory.medecin(2L));
        RendezVousResponse expected = TestDataFactory.rendezVousResponse(3L);

        when(rendezVousRepository.findById(3L)).thenReturn(Optional.of(rdv));
        when(rendezVousRepository.save(rdv)).thenReturn(rdv);
        when(rendezVousMapper.toResponse(rdv)).thenReturn(expected);

        RendezVousResponse response = rendezVousService.changerStatut(3L, StatutRdv.CONFIRME);

        assertThat(response.getId()).isEqualTo(3L);
        assertThat(rdv.getStatut()).isEqualTo(StatutRdv.CONFIRME);
        verify(notificationService).notifierRdvConfirme(rdv);
        verify(auditEventProducer).publierEvenementAudit("UPDATE_STATUT", "RendezVous", 3L);
    }

    @Test
    void shouldCancelRendezVousAndNotifyPatient() {
        RendezVous rdv = TestDataFactory.rendezVous(3L, TestDataFactory.patient(1L), TestDataFactory.medecin(2L));
        RendezVousResponse expected = TestDataFactory.rendezVousResponse(3L);

        when(rendezVousRepository.findById(3L)).thenReturn(Optional.of(rdv));
        when(rendezVousRepository.save(rdv)).thenReturn(rdv);
        when(rendezVousMapper.toResponse(rdv)).thenReturn(expected);

        RendezVousResponse response = rendezVousService.changerStatut(3L, StatutRdv.ANNULE);

        assertThat(response.getId()).isEqualTo(3L);
        assertThat(rdv.getStatut()).isEqualTo(StatutRdv.ANNULE);
        verify(notificationProducer).envoyerAlerteAnnulation(rdv);
        verify(notificationService).notifierRdvAnnule(rdv);
    }

    @Test
    void shouldDeleteExistingAppointment() {
        RendezVous rdv = TestDataFactory.rendezVous(3L, TestDataFactory.patient(1L), TestDataFactory.medecin(2L));
        when(rendezVousRepository.findById(3L)).thenReturn(Optional.of(rdv));

        rendezVousService.delete(3L);

        verify(rendezVousRepository).deleteById(3L);
    }

    @Test
    void shouldAllowPatientToCancelOwnAppointment() {
        Patient patient = TestDataFactory.patient(1L);
        Medecin medecin = TestDataFactory.medecin(2L);
        RendezVous rdv = TestDataFactory.rendezVous(3L, patient, medecin);
        RendezVousResponse expected = TestDataFactory.rendezVousResponse(3L);

        when(rendezVousRepository.findById(3L)).thenReturn(Optional.of(rdv));
        when(patientRepository.findByUser_Email(patient.getUser().getEmail())).thenReturn(Optional.of(patient));
        when(rendezVousRepository.save(rdv)).thenReturn(rdv);
        when(rendezVousMapper.toResponse(rdv)).thenReturn(expected);

        RendezVousResponse response = rendezVousService.annulerMien(3L, patient.getUser().getEmail());

        assertThat(response.getStatut()).isEqualTo(StatutRdv.PLANIFIE);
        assertThat(rdv.getStatut()).isEqualTo(StatutRdv.ANNULE);
        verify(notificationService).notifierRdvAnnule(rdv);
    }

    @Test
    void shouldThrowExceptionWhenPatientCancelsForeignAppointment() {
        Patient owner = TestDataFactory.patient(1L);
        Patient other = TestDataFactory.patient(2L);
        RendezVous rdv = TestDataFactory.rendezVous(3L, owner, TestDataFactory.medecin(2L));

        when(rendezVousRepository.findById(3L)).thenReturn(Optional.of(rdv));
        when(patientRepository.findByUser_Email(other.getUser().getEmail())).thenReturn(Optional.of(other));

        assertThatThrownBy(() -> rendezVousService.annulerMien(3L, other.getUser().getEmail()))
            .isInstanceOf(org.springframework.security.access.AccessDeniedException.class)
            .hasMessageContaining("ne vous appartient pas");
    }

    @Test
    void shouldThrowExceptionWhenCancellingAlreadyCancelledOwnAppointment() {
        Patient patient = TestDataFactory.patient(1L);
        RendezVous rdv = TestDataFactory.rendezVous(3L, patient, TestDataFactory.medecin(2L));
        rdv.setStatut(StatutRdv.ANNULE);

        when(rendezVousRepository.findById(3L)).thenReturn(Optional.of(rdv));
        when(patientRepository.findByUser_Email(patient.getUser().getEmail())).thenReturn(Optional.of(patient));

        assertThatThrownBy(() -> rendezVousService.annulerMien(3L, patient.getUser().getEmail()))
            .isInstanceOf(IllegalStateException.class);

        verify(rendezVousRepository, never()).save(any(RendezVous.class));
    }

    @Test
    void shouldReturnAvailableSlotsExcludingOccupiedOnes() {
        LocalDate date = LocalDate.of(2026, 5, 12);
        Patient patient = TestDataFactory.patient(1L);
        Medecin medecin = TestDataFactory.medecin(2L);
        RendezVous morning = TestDataFactory.rendezVous(1L, patient, medecin);
        RendezVous noon = TestDataFactory.rendezVous(2L, patient, medecin);
        noon.setDateHeure(LocalDateTime.of(2026, 5, 12, 10, 30));

        when(rendezVousRepository.findByMedecinIdAndDateHeureBetweenAndStatutNot(
            medecin.getId(), date.atTime(9, 0), date.atTime(17, 30), StatutRdv.ANNULE))
            .thenReturn(List.of(morning, noon));

        List<String> slots = rendezVousService.getDisponibilites(medecin.getId(), date);

        assertThat(slots).doesNotContain("10:00", "10:30");
        assertThat(slots).contains("09:00", "11:00");
    }

    @Test
    void shouldReturnAppointmentsByPatientAndAuthenticatedPatientEmail() {
        Patient patient = TestDataFactory.patient(1L);
        RendezVous rdv = TestDataFactory.rendezVous(3L, patient, TestDataFactory.medecin(2L));
        RendezVousResponse expected = TestDataFactory.rendezVousResponse(3L);
        PageRequest pageable = PageRequest.of(0, 10);

        when(rendezVousRepository.findByPatientId(patient.getId(), pageable))
            .thenReturn(new PageImpl<>(List.of(rdv), pageable, 1));
        when(rendezVousRepository.findByPatient_User_Email(patient.getUser().getEmail(), pageable))
            .thenReturn(new PageImpl<>(List.of(rdv), pageable, 1));
        when(rendezVousMapper.toResponse(rdv)).thenReturn(expected);

        var byPatient = rendezVousService.getByPatient(patient.getId(), pageable);
        var mine = rendezVousService.getMyRdvs(patient.getUser().getEmail(), pageable);

        assertThat(byPatient.getContent()).hasSize(1);
        assertThat(mine.getContent()).hasSize(1);
    }

    @Test
    void shouldReturnDoctorAppointmentsByEmail() {
        User user = TestDataFactory.user(11L, "doctor@mail.com", Role.MEDECIN);
        Medecin medecin = TestDataFactory.medecin(2L);
        RendezVous rdv = TestDataFactory.rendezVous(3L, TestDataFactory.patient(1L), medecin);
        RendezVousResponse expected = TestDataFactory.rendezVousResponse(3L);

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(medecinRepository.findByUserId(user.getId())).thenReturn(Optional.of(medecin));
        when(rendezVousRepository.findByMedecinId(medecin.getId(), PageRequest.of(0, 10)))
            .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(rdv), PageRequest.of(0, 10), 1));
        when(rendezVousMapper.toResponse(rdv)).thenReturn(expected);

        var page = rendezVousService.getByMedecinEmail(user.getEmail(), PageRequest.of(0, 10));

        assertThat(page.getContent()).hasSize(1);
    }

    @Test
    void shouldThrowExceptionWhenDoctorUserEmailIsUnknown() {
        when(userRepository.findByEmail("missing@mail.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> rendezVousService.getByMedecinEmail("missing@mail.com", PageRequest.of(0, 10)))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("Utilisateur non trouv");
    }

    private void authenticateAsPatient(String email) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
            email,
            "password",
            List.of(new SimpleGrantedAuthority("ROLE_PATIENT"))));
    }
}
