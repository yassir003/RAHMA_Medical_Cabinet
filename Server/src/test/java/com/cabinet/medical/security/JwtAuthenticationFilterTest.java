package com.cabinet.medical.security;

import com.cabinet.medical.entity.User;
import com.cabinet.medical.enums.Role;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtTokenProvider jwtTokenProvider;
    @Mock
    private CustomUserDetailsService customUserDetailsService;
    @Mock
    private FilterChain filterChain;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldAuthenticateWhenTokenIsValid() throws Exception {
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtTokenProvider, customUserDetailsService);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/v1/patients/me");
        request.addHeader("Authorization", "Bearer valid-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        User user = User.builder()
            .id(1L)
            .email("patient@mail.com")
            .password("password")
            .role(Role.PATIENT)
            .passwordChanged(true)
            .enabled(true)
            .build();

        when(jwtTokenProvider.validateToken("valid-token")).thenReturn(true);
        when(jwtTokenProvider.getUsernameFromToken("valid-token")).thenReturn(user.getEmail());
        when(customUserDetailsService.loadUserByUsername(user.getEmail())).thenReturn(user);

        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void shouldBlockPatientWithTemporaryPasswordOutsideChangePasswordEndpoint() throws Exception {
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtTokenProvider, customUserDetailsService);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/v1/patients/me");
        request.addHeader("Authorization", "Bearer valid-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        User user = User.builder()
            .id(1L)
            .email("patient@mail.com")
            .password("password")
            .role(Role.PATIENT)
            .passwordChanged(false)
            .enabled(true)
            .build();

        when(jwtTokenProvider.validateToken("valid-token")).thenReturn(true);
        when(jwtTokenProvider.getUsernameFromToken("valid-token")).thenReturn(user.getEmail());
        when(customUserDetailsService.loadUserByUsername(user.getEmail())).thenReturn(user);

        filter.doFilter(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentAsString()).contains("Mot de passe temporaire");
        verify(filterChain, never()).doFilter(request, response);
    }
}
