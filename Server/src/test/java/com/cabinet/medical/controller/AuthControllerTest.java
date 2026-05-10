package com.cabinet.medical.controller;

import com.cabinet.medical.config.SecurityConfig;
import com.cabinet.medical.dto.request.ChangePasswordRequest;
import com.cabinet.medical.dto.request.LoginRequest;
import com.cabinet.medical.dto.request.RegisterRequest;
import com.cabinet.medical.dto.response.AuthResponse;
import com.cabinet.medical.exception.GlobalExceptionHandler;
import com.cabinet.medical.security.CustomAccessDeniedHandler;
import com.cabinet.medical.security.CustomAuthenticationEntryPoint;
import com.cabinet.medical.security.CustomUserDetailsService;
import com.cabinet.medical.security.JwtAuthenticationFilter;
import com.cabinet.medical.security.JwtTokenProvider;
import com.cabinet.medical.service.AuthService;
import com.cabinet.medical.support.TestCorsConfig;
import com.cabinet.medical.support.TestDataFactory;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import({
    SecurityConfig.class,
    JwtAuthenticationFilter.class,
    CustomAccessDeniedHandler.class,
    CustomAuthenticationEntryPoint.class,
    GlobalExceptionHandler.class,
    TestCorsConfig.class
})
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    void shouldRegisterPatient() throws Exception {
        RegisterRequest request = TestDataFactory.registerRequest();
        AuthResponse response = AuthResponse.builder()
            .token("jwt-token")
            .email(request.getEmail())
            .role("PATIENT")
            .build();
        when(authService.register(any(RegisterRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.token").value("jwt-token"))
            .andExpect(jsonPath("$.message").value("Inscription réussie"));
    }

    @Test
    void shouldRejectInvalidRegisterRequest() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("bad-email");
        request.setPassword("123");

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("Validation échouée"))
            .andExpect(jsonPath("$.details.email").exists());
    }

    @Test
    void shouldLoginSuccessfully() throws Exception {
        LoginRequest request = TestDataFactory.loginRequest();
        AuthResponse response = AuthResponse.builder()
            .token("jwt-token")
            .email(request.getEmail())
            .role("PATIENT")
            .build();
        when(authService.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.token").value("jwt-token"))
            .andExpect(jsonPath("$.message").value("Connexion réussie"));
    }

    @Test
    @WithMockUser(username = "jane.doe@mail.com", roles = "PATIENT")
    void shouldChangePassword() throws Exception {
        ChangePasswordRequest request = TestDataFactory.changePasswordRequest();
        doNothing().when(authService).changePassword(any(ChangePasswordRequest.class));

        mockMvc.perform(post("/api/v1/auth/change-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Mot de passe modifié avec succès"));
    }
}
