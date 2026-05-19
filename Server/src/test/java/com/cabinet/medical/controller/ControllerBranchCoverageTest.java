package com.cabinet.medical.controller;

import com.cabinet.medical.dto.request.PatientRequest;
import com.cabinet.medical.dto.request.RendezVousRequest;
import com.cabinet.medical.dto.response.ConsultationResponse;
import com.cabinet.medical.dto.response.PatientResponse;
import com.cabinet.medical.dto.response.RendezVousResponse;
import com.cabinet.medical.enums.StatutRdv;
import com.cabinet.medical.service.ConsultationService;
import com.cabinet.medical.service.PatientService;
import com.cabinet.medical.service.RendezVousService;
import com.cabinet.medical.support.TestDataFactory;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Controller branch coverage")
class ControllerBranchCoverageTest {

    @Mock
    private PatientService patientService;
    @Mock
    private ConsultationService consultationService;
    @Mock
    private RendezVousService rendezVousService;

    @Test
    @DisplayName("should return patient self profile appointments profile update and consultations")
    void shouldReturnPatientSelfProfileAppointmentsProfileUpdateAndConsultations() {
        PatientController controller = new PatientController(patientService, consultationService, rendezVousService);
        var auth = new UsernamePasswordAuthenticationToken("patient@mail.com", "password");
        PatientResponse patient = TestDataFactory.patientResponse(1L);
        RendezVousResponse rdv = TestDataFactory.rendezVousResponse(2L);
        ConsultationResponse consultation = TestDataFactory.consultationResponse(3L);
        PatientRequest request = TestDataFactory.patientRequest();
        when(patientService.getMe("patient@mail.com")).thenReturn(patient);
        when(patientService.updateMe("patient@mail.com", request)).thenReturn(patient);
        when(rendezVousService.getMyRdvs(eq("patient@mail.com"), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(rdv)));
        when(consultationService.getByPatient(eq(1L), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(consultation)));

        var meResponse = controller.getMe(auth);
        var rdvResponse = controller.getMyRendezVous(auth, 0, 20);
        var updateResponse = controller.updateMe(auth, request);
        var consultationResponse = controller.getMyConsultations(auth, 0, 20);

        assertThat(meResponse.getBody().getData().getId()).isEqualTo(1L);
        assertThat(rdvResponse.getBody().getData().getContent()).containsExactly(rdv);
        assertThat(updateResponse.getBody().getData().getEmail()).isEqualTo("jane.doe@mail.com");
        assertThat(consultationResponse.getBody().getData().getContent()).containsExactly(consultation);
    }

    @Test
    @DisplayName("should return patient administration endpoints when patient controller is called")
    void shouldReturnPatientAdministrationEndpointsWhenPatientControllerIsCalled() {
        PatientController controller = new PatientController(patientService, consultationService, rendezVousService);
        var auth = new UsernamePasswordAuthenticationToken("doctor@mail.com", "password");
        PatientResponse patient = TestDataFactory.patientResponse(4L);
        PatientRequest request = TestDataFactory.patientRequest();
        when(patientService.getMyPatients(eq("doctor@mail.com"), eq("doe"), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(patient)));
        when(patientService.getAllPatients(eq("doe"), any(Pageable.class))).thenReturn(new PageImpl<>(List.of(patient)));
        when(patientService.getById(4L)).thenReturn(patient);
        when(patientService.create(request)).thenReturn(patient);
        when(patientService.update(4L, request)).thenReturn(patient);

        var myPatients = controller.getMyPatients(auth, 0, 100, "doe");
        var allPatients = controller.getAll(0, 10, "nom", "desc", "doe");
        var byId = controller.getById(4L);
        var created = controller.create(request);
        var updated = controller.update(4L, request);
        var deleted = controller.delete(4L);

        assertThat(myPatients.getBody().getData().getContent()).containsExactly(patient);
        assertThat(allPatients.getBody().getData().getContent()).containsExactly(patient);
        assertThat(byId.getBody().getData().getId()).isEqualTo(4L);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(updated.getBody().getData().getId()).isEqualTo(4L);
        assertThat(deleted.getBody().getStatus()).isEqualTo(200);
        verify(patientService).delete(4L);
    }

    @Test
    @DisplayName("should return patient consultation and appointment pages by patient id")
    void shouldReturnPatientConsultationAndAppointmentPagesByPatientId() {
        PatientController controller = new PatientController(patientService, consultationService, rendezVousService);
        ConsultationResponse consultation = TestDataFactory.consultationResponse(5L);
        RendezVousResponse appointment = TestDataFactory.rendezVousResponse(6L);
        when(consultationService.getByPatient(eq(7L), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(consultation)));
        when(rendezVousService.getByPatient(eq(7L), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(appointment)));

        var consultations = controller.getConsultations(7L, 0, 10);
        var appointments = controller.getRendezVous(7L, 0, 10);

        assertThat(consultations.getBody().getData().getContent()).containsExactly(consultation);
        assertThat(appointments.getBody().getData().getContent()).containsExactly(appointment);
    }

    @Test
    @DisplayName("should return doctor appointment branches when rendezvous controller is called")
    void shouldReturnDoctorAppointmentBranchesWhenRendezvousControllerIsCalled() {
        RendezVousController controller = new RendezVousController(rendezVousService);
        var auth = new UsernamePasswordAuthenticationToken("doctor@mail.com", "password");
        RendezVousResponse appointment = TestDataFactory.rendezVousResponse(8L);
        when(rendezVousService.getAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(appointment)));
        when(rendezVousService.getByMedecinEmail(eq("doctor@mail.com"), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(appointment)));

        var allResponse = controller.getAll(0, 10, "dateHeure", "desc");
        var mineResponse = controller.getMyRdvs(auth, 0, 100, "dateHeure", "asc");

        assertThat(allResponse.getBody().getData().getContent()).containsExactly(appointment);
        assertThat(mineResponse.getBody().getData().getContent()).containsExactly(appointment);
    }

    @Test
    @DisplayName("should mutate appointment and expose availability endpoints")
    void shouldMutateAppointmentAndExposeAvailabilityEndpoints() {
        RendezVousController controller = new RendezVousController(rendezVousService);
        var auth = new UsernamePasswordAuthenticationToken("patient@mail.com", "password");
        RendezVousRequest request = TestDataFactory.rendezVousRequest();
        RendezVousResponse appointment = TestDataFactory.rendezVousResponse(9L);
        when(rendezVousService.getById(9L)).thenReturn(appointment);
        when(rendezVousService.creerRendezVous(request)).thenReturn(appointment);
        when(rendezVousService.update(9L, request)).thenReturn(appointment);
        when(rendezVousService.changerStatut(9L, StatutRdv.CONFIRME)).thenReturn(appointment);
        when(rendezVousService.annulerMien(9L, "patient@mail.com")).thenReturn(appointment);
        when(rendezVousService.getDisponibilites(2L, LocalDate.of(2026, 5, 25))).thenReturn(List.of("09:00"));

        var byId = controller.getById(9L);
        var created = controller.create(request);
        var updated = controller.update(9L, request);
        var status = controller.changerStatut(9L, StatutRdv.CONFIRME);
        var deleted = controller.delete(9L);
        var cancelled = controller.annulerMien(9L, auth);
        var slots = controller.getDisponibilites(2L, LocalDate.of(2026, 5, 25));

        assertThat(byId.getBody().getData().getId()).isEqualTo(9L);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(updated.getBody().getData().getId()).isEqualTo(9L);
        assertThat(status.getBody().getData().getId()).isEqualTo(9L);
        assertThat(deleted.getBody().getStatus()).isEqualTo(200);
        assertThat(cancelled.getBody().getData().getId()).isEqualTo(9L);
        assertThat(slots.getBody().getData()).containsExactly("09:00");
        verify(rendezVousService).delete(9L);
    }
}
