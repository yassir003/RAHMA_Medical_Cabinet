package com.cabinet.medical.controller;

import com.cabinet.medical.config.SecurityConfig;
import com.cabinet.medical.dto.request.OrdonnanceRequest;
import com.cabinet.medical.dto.response.ConsultationSummary;
import com.cabinet.medical.dto.response.MedecinSummary;
import com.cabinet.medical.dto.response.OrdonnanceResponse;
import com.cabinet.medical.dto.response.PatientSummary;
import com.cabinet.medical.enums.Role;
import com.cabinet.medical.exception.GlobalExceptionHandler;
import com.cabinet.medical.security.CustomAccessDeniedHandler;
import com.cabinet.medical.security.CustomAuthenticationEntryPoint;
import com.cabinet.medical.security.CustomUserDetailsService;
import com.cabinet.medical.security.JwtAuthenticationFilter;
import com.cabinet.medical.security.JwtTokenProvider;
import com.cabinet.medical.service.OrdonnanceService;
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

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(OrdonnanceController.class)
@Import({
    SecurityConfig.class,
    JwtAuthenticationFilter.class,
    CustomAccessDeniedHandler.class,
    CustomAuthenticationEntryPoint.class,
    GlobalExceptionHandler.class,
    TestCorsConfig.class
})
class OrdonnanceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OrdonnanceService ordonnanceService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    @WithMockUser(username = "doctor@mail.com", roles = "MEDECIN")
    void shouldCreateOrdonnance() throws Exception {
        when(ordonnanceService.create(any(OrdonnanceRequest.class), eq("doctor@mail.com")))
            .thenReturn(ordonnanceResponse(1L));

        mockMvc.perform(post("/api/v1/ordonnances")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(TestDataFactory.ordonnanceRequest())))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.id").value(1L));
    }

    @Test
    @WithMockUser(username = "patient@mail.com", roles = "PATIENT")
    void shouldReturnOrdonnancesForCurrentRole() throws Exception {
        when(ordonnanceService.getForRole(eq("patient@mail.com"), eq(Role.PATIENT), eq(null), eq(null), any()))
            .thenReturn(new PageImpl<>(List.of(ordonnanceResponse(1L))));

        mockMvc.perform(get("/api/v1/ordonnances"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.content[0].id").value(1L));
    }

    @Test
    @WithMockUser(username = "doctor@mail.com", roles = "MEDECIN")
    void shouldCancelOrdonnance() throws Exception {
        when(ordonnanceService.annuler(1L, "doctor@mail.com")).thenReturn(ordonnanceResponse(1L));

        mockMvc.perform(patch("/api/v1/ordonnances/1/annuler"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Ordonnance annulee"));
    }

    @Test
    @WithMockUser(username = "patient@mail.com", roles = "PATIENT")
    void shouldDownloadPdf() throws Exception {
        when(ordonnanceService.generatePdf(1L, "patient@mail.com", Role.PATIENT)).thenReturn("pdf".getBytes());

        mockMvc.perform(get("/api/v1/ordonnances/1/pdf"))
            .andExpect(status().isOk())
            .andExpect(header().string("Content-Disposition", "attachment; filename=ordonnance-1.pdf"))
            .andExpect(content().bytes("pdf".getBytes()));
    }

    private OrdonnanceResponse ordonnanceResponse(Long id) {
        return OrdonnanceResponse.builder()
            .id(id)
            .dateCreation(LocalDateTime.of(2026, 5, 12, 12, 0))
            .dureeTraitement("5 jours")
            .instructions("Instructions")
            .consultation(ConsultationSummary.builder().id(3L).motif("Suivi").build())
            .medecin(MedecinSummary.builder().id(2L).nom("House").prenom("Gregory").build())
            .patient(PatientSummary.builder().id(1L).nom("Doe").prenom("Jane").build())
            .build();
    }
}
