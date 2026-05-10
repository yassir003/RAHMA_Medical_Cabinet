package com.cabinet.medical.controller;

import com.cabinet.medical.config.SecurityConfig;
import com.cabinet.medical.dto.request.PatientRequest;
import com.cabinet.medical.dto.response.PatientResponse;
import com.cabinet.medical.exception.GlobalExceptionHandler;
import com.cabinet.medical.security.CustomAccessDeniedHandler;
import com.cabinet.medical.security.CustomAuthenticationEntryPoint;
import com.cabinet.medical.security.CustomUserDetailsService;
import com.cabinet.medical.security.JwtAuthenticationFilter;
import com.cabinet.medical.security.JwtTokenProvider;
import com.cabinet.medical.service.ConsultationService;
import com.cabinet.medical.service.PatientService;
import com.cabinet.medical.service.RendezVousService;
import com.cabinet.medical.support.TestCorsConfig;
import com.cabinet.medical.support.TestDataFactory;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PatientController.class)
@Import({
    SecurityConfig.class,
    JwtAuthenticationFilter.class,
    CustomAccessDeniedHandler.class,
    CustomAuthenticationEntryPoint.class,
    GlobalExceptionHandler.class,
    TestCorsConfig.class
})
class PatientControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PatientService patientService;

    @MockBean
    private ConsultationService consultationService;

    @MockBean
    private RendezVousService rendezVousService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    @WithMockUser(roles = "SECRETAIRE")
    void shouldReturnPatientsPage() throws Exception {
        PatientResponse patient = TestDataFactory.patientResponse(1L);
        when(patientService.getAllPatients(eq("Doe"), any(PageRequest.class)))
            .thenReturn(new PageImpl<>(List.of(patient), PageRequest.of(0, 10), 1));

        mockMvc.perform(get("/api/v1/patients").param("search", "Doe"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.content[0].id").value(1L))
            .andExpect(jsonPath("$.message").value("Patients récupérés"));
    }

    @Test
    @WithMockUser(username = "jane.doe@mail.com", roles = "PATIENT")
    void shouldReturnCurrentPatientProfile() throws Exception {
        when(patientService.getMe("jane.doe@mail.com")).thenReturn(TestDataFactory.patientResponse(1L));

        mockMvc.perform(get("/api/v1/patients/me"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.email").value("jane.doe@mail.com"));
    }

    @Test
    @WithMockUser(roles = "SECRETAIRE")
    void shouldCreatePatient() throws Exception {
        PatientRequest request = TestDataFactory.patientRequest();
        when(patientService.create(any(PatientRequest.class))).thenReturn(TestDataFactory.patientResponse(1L));

        mockMvc.perform(post("/api/v1/patients")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.id").value(1L))
            .andExpect(jsonPath("$.message").value("Patient créé"));
    }

    @Test
    @WithMockUser(roles = "SECRETAIRE")
    void shouldRejectInvalidPatientRequest() throws Exception {
        PatientRequest request = new PatientRequest();

        mockMvc.perform(post("/api/v1/patients")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.details.nom").exists())
            .andExpect(jsonPath("$.details.prenom").exists());
    }

    @Test
    @WithMockUser(roles = "PATIENT")
    void shouldDenyPatientCreationForPatientRole() throws Exception {
        mockMvc.perform(post("/api/v1/patients")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(TestDataFactory.patientRequest())))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "SECRETAIRE")
    void shouldUpdatePatient() throws Exception {
        when(patientService.update(eq(1L), any(PatientRequest.class))).thenReturn(TestDataFactory.patientResponse(1L));

        mockMvc.perform(put("/api/v1/patients/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(TestDataFactory.patientRequest())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.id").value(1L));
    }
}
