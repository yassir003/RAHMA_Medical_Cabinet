package com.cabinet.medical.service;

import com.cabinet.medical.dto.response.ConsultationResponse;
import com.cabinet.medical.dto.response.MedecinResponse;
import com.cabinet.medical.dto.response.PatientResponse;
import com.cabinet.medical.dto.response.RendezVousResponse;
import com.cabinet.medical.enums.StatutRdv;
import com.cabinet.medical.support.TestDataFactory;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ChatAiService tool execution")
class ChatAiServiceToolCoverageTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private MedecinService medecinService;
    @Mock
    private RendezVousService rendezVousService;
    @Mock
    private PatientService patientService;
    @Mock
    private ConsultationService consultationService;
    @Mock
    private AuthService authService;

    @Test
    @DisplayName("should return doctor list when get_doctors finds matching doctors")
    void shouldReturnDoctorListWhenGetDoctorsFindsMatchingDoctors() throws Exception {
        ChatAiService service = service();
        MedecinResponse doctor = TestDataFactory.medecinResponse(1L);
        doctor.setEmail("doctor@mail.com");
        when(medecinService.getAll("cardio", PageRequest.of(0, 50))).thenReturn(new PageImpl<>(List.of(doctor)));

        String result = executeTool(service, "get_doctors", "{\"search\":\"cardio\"}", null);

        JsonNode doctors = objectMapper.readTree(result);
        assertThat(doctors.size()).isEqualTo(1);
        assertThat(doctors.get(0).get("nom").asText()).contains("Dr.");
        assertThat(doctors.get(0).get("specialite").asText()).isEqualTo("Cardiology");
    }

    @Test
    @DisplayName("should return empty doctor message when get_doctors finds no doctors")
    void shouldReturnEmptyDoctorMessageWhenGetDoctorsFindsNoDoctors() {
        ChatAiService service = service();
        when(medecinService.getAll(null, PageRequest.of(0, 50))).thenReturn(new PageImpl<>(List.of()));

        String result = executeTool(service, "get_doctors", "{}", null);

        assertThat(result).contains("Aucun");
    }

    @Test
    @DisplayName("should return available slots when doctor can be resolved by searched name")
    void shouldReturnAvailableSlotsWhenDoctorCanBeResolvedBySearchedName() throws Exception {
        ChatAiService service = service();
        MedecinResponse doctor = TestDataFactory.medecinResponse(2L);
        when(medecinService.getAll("Gregory House", PageRequest.of(0, 50))).thenReturn(new PageImpl<>(List.of(doctor)));
        when(rendezVousService.getDisponibilites(2L, LocalDate.of(2026, 5, 20))).thenReturn(List.of("09:00", "09:30"));

        String result = executeTool(service, "get_available_slots",
            "{\"medecinName\":\"Dr. Gregory House\",\"date\":\"2026-05-20\"}", null);

        JsonNode payload = objectMapper.readTree(result);
        assertThat(payload.get("medecin").asText()).contains("Gregory");
        assertThat(payload.get("creneaux").size()).isEqualTo(2);
    }

    @Test
    @DisplayName("should return unavailable slots message when doctor has no free slots")
    void shouldReturnUnavailableSlotsMessageWhenDoctorHasNoFreeSlots() {
        ChatAiService service = service();
        MedecinResponse doctor = TestDataFactory.medecinResponse(3L);
        when(medecinService.getAll("Gregory House", PageRequest.of(0, 50))).thenReturn(new PageImpl<>(List.of(doctor)));
        when(rendezVousService.getDisponibilites(3L, LocalDate.of(2026, 5, 21))).thenReturn(List.of());

        String result = executeTool(service, "get_available_slots",
            "{\"medecinName\":\"Dr. Gregory House\",\"date\":\"2026-05-21\"}", null);

        assertThat(result).contains("Aucun");
        assertThat(result).contains("2026-05-21");
    }

    @Test
    @DisplayName("should resolve doctor from full list when exact doctor search is empty")
    void shouldResolveDoctorFromFullListWhenExactDoctorSearchIsEmpty() throws Exception {
        ChatAiService service = service();
        MedecinResponse doctor = TestDataFactory.medecinResponse(4L);
        when(medecinService.getAll("House", PageRequest.of(0, 50))).thenReturn(new PageImpl<>(List.of()));
        when(medecinService.getAll(null, PageRequest.of(0, 500))).thenReturn(new PageImpl<>(List.of(doctor)));
        when(rendezVousService.getDisponibilites(4L, LocalDate.of(2026, 5, 22))).thenReturn(List.of("10:00"));

        String result = executeTool(service, "get_available_slots",
            "{\"medecinName\":\"Dr. House\",\"date\":\"2026-05-22\"}", null);

        assertThat(objectMapper.readTree(result).get("creneaux").get(0).asText()).isEqualTo("10:00");
    }

    @Test
    @DisplayName("should register patient and return patient email when registration succeeds")
    void shouldRegisterPatientAndReturnPatientEmailWhenRegistrationSucceeds() throws Exception {
        ChatAiService service = service();

        String result = executeTool(service, "register_patient",
            "{\"nom\":\"Doe\",\"prenom\":\"Jane\",\"cin\":\"AB1\",\"email\":\"jane@mail.com\","
                + "\"password\":\"Password123\",\"telephone\":\"0600000000\","
                + "\"adresse\":\"Rabat\",\"dateNaissance\":\"1990-01-01\"}", null);

        JsonNode payload = objectMapper.readTree(result);
        assertThat(payload.get("success").asBoolean()).isTrue();
        assertThat(payload.get("patientEmail").asText()).isEqualTo("jane@mail.com");
        verify(authService).register(any());
    }

    @Test
    @DisplayName("should return register error when registration service throws exception")
    void shouldReturnRegisterErrorWhenRegistrationServiceThrowsException() {
        ChatAiService service = service();
        when(authService.register(any())).thenThrow(new IllegalStateException("email exists"));

        String result = executeTool(service, "register_patient",
            "{\"nom\":\"Doe\",\"prenom\":\"Jane\",\"cin\":\"AB1\",\"email\":\"jane@mail.com\","
                + "\"password\":\"Password123\"}", null);

        assertThat(result).contains("erreur");
        assertThat(result).contains("email exists");
    }

    @Test
    @DisplayName("should reject appointment creation when anonymous patient has no email")
    void shouldRejectAppointmentCreationWhenAnonymousPatientHasNoEmail() {
        ChatAiService service = service();

        String result = executeTool(service, "create_appointment",
            "{\"medecinName\":\"Dr. Gregory House\",\"dateHeure\":\"2026-05-23T10:00:00\","
                + "\"motif\":\"Controle\"}", null);

        assertThat(result).contains("connect");
        assertThat(result).contains("register_patient");
    }

    @Test
    @DisplayName("should reject appointment creation when authenticated user is not patient")
    void shouldRejectAppointmentCreationWhenAuthenticatedUserIsNotPatient() {
        ChatAiService service = service();

        String result = executeTool(service, "create_appointment",
            "{\"medecinName\":\"Dr. Gregory House\",\"dateHeure\":\"2026-05-23T10:00:00\","
                + "\"motif\":\"Controle\"}", auth("admin@mail.com", "ROLE_ADMIN"));

        assertThat(result).contains("patients");
    }

    @Test
    @DisplayName("should create appointment when authenticated patient and doctor are valid")
    void shouldCreateAppointmentWhenAuthenticatedPatientAndDoctorAreValid() throws Exception {
        ChatAiService service = service();
        PatientResponse patient = TestDataFactory.patientResponse(5L);
        MedecinResponse doctor = TestDataFactory.medecinResponse(6L);
        RendezVousResponse appointment = TestDataFactory.rendezVousResponse(7L);
        appointment.setDateHeure(LocalDateTime.of(2026, 5, 23, 10, 0));
        appointment.setStatut(StatutRdv.PLANIFIE);
        when(patientService.getMe("patient@mail.com")).thenReturn(patient);
        when(medecinService.getAll("Gregory House", PageRequest.of(0, 50))).thenReturn(new PageImpl<>(List.of(doctor)));
        when(rendezVousService.creerRendezVous(any())).thenReturn(appointment);

        String result = executeTool(service, "create_appointment",
            "{\"medecinName\":\"Dr. Gregory House\",\"dateHeure\":\"2026-05-23T10:00:00\","
                + "\"motif\":\"Controle\",\"notes\":\"A jeun\"}", auth("patient@mail.com", "ROLE_PATIENT"));

        JsonNode payload = objectMapper.readTree(result);
        assertThat(payload.get("id").asLong()).isEqualTo(7L);
        assertThat(payload.get("motif").asText()).isEqualTo("Controle");
        verify(rendezVousService).creerRendezVous(any());
    }

    @Test
    @DisplayName("should create appointment for anonymous patient when patient email exists")
    void shouldCreateAppointmentForAnonymousPatientWhenPatientEmailExists() throws Exception {
        ChatAiService service = service();
        PatientResponse patient = TestDataFactory.patientResponse(8L);
        MedecinResponse doctor = TestDataFactory.medecinResponse(9L);
        RendezVousResponse appointment = TestDataFactory.rendezVousResponse(10L);
        when(patientService.getMe("patient@mail.com")).thenReturn(patient);
        when(medecinService.getAll("Gregory House", PageRequest.of(0, 50))).thenReturn(new PageImpl<>(List.of(doctor)));
        when(rendezVousService.creerRendezVous(any())).thenReturn(appointment);

        String result = executeTool(service, "create_appointment",
            "{\"patientEmail\":\"patient@mail.com\",\"medecinName\":\"Dr. Gregory House\","
                + "\"dateHeure\":\"2026-05-24T11:00:00\",\"motif\":\"Suivi\"}", auth("anonymousUser"));

        assertThat(objectMapper.readTree(result).get("id").asLong()).isEqualTo(10L);
    }

    @Test
    @DisplayName("should return appointments when authenticated patient has appointments")
    void shouldReturnAppointmentsWhenAuthenticatedPatientHasAppointments() throws Exception {
        ChatAiService service = service();
        RendezVousResponse appointment = TestDataFactory.rendezVousResponse(11L);
        when(rendezVousService.getMyRdvs(eq("patient@mail.com"), any(PageRequest.class)))
            .thenReturn(new PageImpl<>(List.of(appointment)));

        String result = executeTool(service, "get_my_appointments", "{}", auth("patient@mail.com", "ROLE_PATIENT"));

        JsonNode appointments = objectMapper.readTree(result);
        assertThat(appointments.size()).isEqualTo(1);
        assertThat(appointments.get(0).get("id").asLong()).isEqualTo(11L);
    }

    @Test
    @DisplayName("should return empty appointments message when authenticated patient has no appointments")
    void shouldReturnEmptyAppointmentsMessageWhenAuthenticatedPatientHasNoAppointments() {
        ChatAiService service = service();
        when(rendezVousService.getMyRdvs(eq("patient@mail.com"), any(PageRequest.class)))
            .thenReturn(new PageImpl<>(List.of()));

        String result = executeTool(service, "get_my_appointments", "{}", auth("patient@mail.com", "ROLE_PATIENT"));

        assertThat(result).contains("aucun rendez-vous");
    }

    @Test
    @DisplayName("should return medical followup when authenticated patient has consultations")
    void shouldReturnMedicalFollowupWhenAuthenticatedPatientHasConsultations() throws Exception {
        ChatAiService service = service();
        PatientResponse patient = TestDataFactory.patientResponse(12L);
        ConsultationResponse consultation = TestDataFactory.consultationResponse(13L);
        consultation.setMontantTotal(BigDecimal.valueOf(350));
        when(patientService.getMe("patient@mail.com")).thenReturn(patient);
        when(consultationService.getByPatient(eq(12L), any(PageRequest.class)))
            .thenReturn(new PageImpl<>(List.of(consultation)));

        String result = executeTool(service, "get_my_medical_followup", "{}", auth("patient@mail.com", "ROLE_PATIENT"));

        JsonNode consultations = objectMapper.readTree(result);
        assertThat(consultations.get(0).get("id").asLong()).isEqualTo(13L);
        assertThat(consultations.get(0).get("montantTotal").decimalValue()).isEqualByComparingTo("350");
    }

    @Test
    @DisplayName("should return error json when unknown tool is requested")
    void shouldReturnErrorJsonWhenUnknownToolIsRequested() {
        ChatAiService service = service();

        String result = executeTool(service, "unknown_tool", "{}", null);

        assertThat(result).contains("erreur");
        assertThat(result).contains("Outil inconnu");
    }

    @Test
    @DisplayName("should return error json when tool arguments are invalid json")
    void shouldReturnErrorJsonWhenToolArgumentsAreInvalidJson() {
        ChatAiService service = service();

        String result = executeTool(service, "get_doctors", "{invalid", null);

        assertThat(result).contains("erreur");
    }

    private ChatAiService service() {
        return new ChatAiService(objectMapper, medecinService, rendezVousService, patientService, consultationService, authService);
    }

    private String executeTool(ChatAiService service, String name, String argsJson, Authentication auth) {
        return ReflectionTestUtils.invokeMethod(service, "executeTool", name, argsJson, auth);
    }

    private Authentication auth(String name, String... roles) {
        List<SimpleGrantedAuthority> authorities = List.of(roles).stream()
            .map(SimpleGrantedAuthority::new)
            .toList();
        return new UsernamePasswordAuthenticationToken(name, "password", authorities);
    }
}
