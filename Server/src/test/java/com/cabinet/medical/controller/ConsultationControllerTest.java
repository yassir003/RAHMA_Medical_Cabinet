package com.cabinet.medical.controller;

import com.cabinet.medical.config.SecurityConfig;
import com.cabinet.medical.dto.request.ConsultationRequest;
import com.cabinet.medical.exception.GlobalExceptionHandler;
import com.cabinet.medical.security.CustomAccessDeniedHandler;
import com.cabinet.medical.security.CustomAuthenticationEntryPoint;
import com.cabinet.medical.security.CustomUserDetailsService;
import com.cabinet.medical.security.JwtAuthenticationFilter;
import com.cabinet.medical.security.JwtTokenProvider;
import com.cabinet.medical.service.ConsultationService;
import com.cabinet.medical.support.TestCorsConfig;
import com.cabinet.medical.support.TestDataFactory;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ConsultationController.class)
@Import({
    SecurityConfig.class,
    JwtAuthenticationFilter.class,
    CustomAccessDeniedHandler.class,
    CustomAuthenticationEntryPoint.class,
    GlobalExceptionHandler.class,
    TestCorsConfig.class
})
class ConsultationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ConsultationService consultationService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    @WithMockUser(roles = "MEDECIN")
    void shouldReturnConsultationsPage() throws Exception {
        when(consultationService.getAll(any()))
            .thenReturn(new PageImpl<>(List.of(TestDataFactory.consultationResponse(1L))));

        mockMvc.perform(get("/api/v1/consultations"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.content[0].id").value(1L));
    }

    @Test
    @WithMockUser(username = "doctor@mail.com", roles = "MEDECIN")
    void shouldCreateConsultation() throws Exception {
        ConsultationRequest request = TestDataFactory.consultationRequest();
        when(consultationService.create(any(ConsultationRequest.class)))
            .thenReturn(TestDataFactory.consultationResponse(1L));

        mockMvc.perform(post("/api/v1/consultations")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.id").value(1L));
    }

    @Test
    @WithMockUser(roles = "MEDECIN")
    void shouldRejectInvalidConsultationRequest() throws Exception {
        mockMvc.perform(post("/api/v1/consultations")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new ConsultationRequest())))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.details.patientId").exists());
    }

    @Test
    @WithMockUser(username = "patient@mail.com", roles = "PATIENT")
    void shouldReturnConsultationForPatientRole() throws Exception {
        when(consultationService.getByIdForRole(eq(1L), any()))
            .thenReturn(TestDataFactory.consultationResponse(1L));

        mockMvc.perform(get("/api/v1/consultations/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Consultation trouvée"));
    }
}
