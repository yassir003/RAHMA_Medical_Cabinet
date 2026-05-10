package com.cabinet.medical.controller;

import com.cabinet.medical.config.SecurityConfig;
import com.cabinet.medical.dto.request.RendezVousRequest;
import com.cabinet.medical.exception.GlobalExceptionHandler;
import com.cabinet.medical.security.CustomAccessDeniedHandler;
import com.cabinet.medical.security.CustomAuthenticationEntryPoint;
import com.cabinet.medical.security.CustomUserDetailsService;
import com.cabinet.medical.security.JwtAuthenticationFilter;
import com.cabinet.medical.security.JwtTokenProvider;
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
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RendezVousController.class)
@Import({
    SecurityConfig.class,
    JwtAuthenticationFilter.class,
    CustomAccessDeniedHandler.class,
    CustomAuthenticationEntryPoint.class,
    GlobalExceptionHandler.class,
    TestCorsConfig.class
})
class RendezVousControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RendezVousService rendezVousService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    @WithMockUser(roles = "SECRETAIRE")
    void shouldReturnRendezVousPage() throws Exception {
        when(rendezVousService.getAll(any(PageRequest.class)))
            .thenReturn(new PageImpl<>(List.of(TestDataFactory.rendezVousResponse(1L))));

        mockMvc.perform(get("/api/v1/rendez-vous"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.content[0].id").value(1L));
    }

    @Test
    @WithMockUser(roles = "PATIENT")
    void shouldCreateRendezVous() throws Exception {
        RendezVousRequest request = TestDataFactory.rendezVousRequest();
        when(rendezVousService.creerRendezVous(any(RendezVousRequest.class)))
            .thenReturn(TestDataFactory.rendezVousResponse(1L));

        mockMvc.perform(post("/api/v1/rendez-vous")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.id").value(1L))
            .andExpect(jsonPath("$.message").value("Rendez-vous créé"));
    }

    @Test
    @WithMockUser(roles = "PATIENT")
    void shouldRejectInvalidRendezVousRequest() throws Exception {
        mockMvc.perform(post("/api/v1/rendez-vous")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new RendezVousRequest())))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.details.patientId").exists())
            .andExpect(jsonPath("$.details.medecinId").exists());
    }

    @Test
    @WithMockUser(username = "jane.doe@mail.com", roles = "PATIENT")
    void shouldCancelOwnRendezVous() throws Exception {
        when(rendezVousService.annulerMien(1L, "jane.doe@mail.com")).thenReturn(TestDataFactory.rendezVousResponse(1L));

        mockMvc.perform(patch("/api/v1/rendez-vous/1/annuler"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Rendez-vous annulé"));
    }

    @Test
    @WithAnonymousUser
    void shouldReturnDisponibilitesWithoutAuthentication() throws Exception {
        when(rendezVousService.getDisponibilites(eq(2L), eq(java.time.LocalDate.of(2026, 5, 12))))
            .thenReturn(List.of("09:00", "09:30"));

        mockMvc.perform(get("/api/v1/rendez-vous/disponibilites/2")
                .param("date", "2026-05-12"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[0]").value("09:00"));
    }
}
