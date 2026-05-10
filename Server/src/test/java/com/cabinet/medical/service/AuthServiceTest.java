package com.cabinet.medical.service;

import com.cabinet.medical.dto.request.ChangePasswordRequest;
import com.cabinet.medical.dto.request.LoginRequest;
import com.cabinet.medical.dto.request.RegisterRequest;
import com.cabinet.medical.dto.response.AuthResponse;
import com.cabinet.medical.entity.Patient;
import com.cabinet.medical.entity.User;
import com.cabinet.medical.enums.Role;
import com.cabinet.medical.exception.RegistrationException;
import com.cabinet.medical.exception.ResourceNotFoundException;
import com.cabinet.medical.messaging.producer.AuditEventProducer;
import com.cabinet.medical.repository.PatientRepository;
import com.cabinet.medical.repository.UserRepository;
import com.cabinet.medical.security.JwtTokenProvider;
import com.cabinet.medical.support.TestDataFactory;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private JwtTokenProvider jwtTokenProvider;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PatientRepository patientRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuditEventProducer auditEventProducer;

    @InjectMocks
    private AuthService authService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldLoginSuccessfully() {
        LoginRequest request = TestDataFactory.loginRequest();
        User user = TestDataFactory.user(1L, request.getEmail(), Role.PATIENT);
        user.setPasswordChanged(false);
        Authentication authentication = new UsernamePasswordAuthenticationToken(
            user, null, user.getAuthorities());

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(true);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
            .thenReturn(authentication);
        when(jwtTokenProvider.generateToken(user)).thenReturn("jwt-token");

        AuthResponse response = authService.login(request);

        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getEmail()).isEqualTo(request.getEmail());
        assertThat(response.getRole()).isEqualTo("PATIENT");
        assertThat(response.isPasswordChanged()).isFalse();
        assertThat(response.getPages()).isNotEmpty();
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    void shouldThrowExceptionWhenLoginEmailDoesNotExist() {
        LoginRequest request = TestDataFactory.loginRequest();
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("Aucun compte trouvé");
    }

    @Test
    void shouldRegisterPatient() {
        RegisterRequest request = TestDataFactory.registerRequest();
        User savedUser = TestDataFactory.user(10L, request.getEmail(), Role.PATIENT);
        Patient savedPatient = TestDataFactory.patient(20L);
        savedPatient.setUser(savedUser);

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(patientRepository.findByCin(request.getCin())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(request.getPassword())).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(patientRepository.save(any(Patient.class))).thenReturn(savedPatient);
        when(jwtTokenProvider.generateToken(savedUser)).thenReturn("registered-token");

        AuthResponse response = authService.register(request);

        assertThat(response.getToken()).isEqualTo("registered-token");
        assertThat(response.getRole()).isEqualTo("PATIENT");
        verify(auditEventProducer).publierEvenementAudit("REGISTER", "Patient", savedPatient.getId());
    }

    @Test
    void shouldThrowExceptionWhenRegisterEmailAlreadyExists() {
        RegisterRequest request = TestDataFactory.registerRequest();
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
            .isInstanceOf(RegistrationException.class)
            .hasMessageContaining("email");
    }

    @Test
    void shouldChangePassword() {
        ChangePasswordRequest request = TestDataFactory.changePasswordRequest();
        User user = TestDataFactory.user(1L, "jane.doe@mail.com", Role.PATIENT);
        user.setPassword("encoded-old");
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(user.getEmail(), null));

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.getAncienMotDePasse(), "encoded-old")).thenReturn(true);
        when(passwordEncoder.encode(request.getNouveauMotDePasse())).thenReturn("encoded-new");

        authService.changePassword(request);

        assertThat(user.isPasswordChanged()).isTrue();
        assertThat(user.getPassword()).isEqualTo("encoded-new");
        verify(userRepository).save(user);
        verify(auditEventProducer).publierEvenementAudit("CHANGE_PASSWORD", "User", user.getId());
    }

    @Test
    void shouldThrowExceptionWhenOldPasswordIsInvalid() {
        ChangePasswordRequest request = TestDataFactory.changePasswordRequest();
        User user = TestDataFactory.user(1L, "jane.doe@mail.com", Role.PATIENT);
        user.setPassword("encoded-old");
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(user.getEmail(), null));

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.getAncienMotDePasse(), "encoded-old")).thenReturn(false);

        assertThatThrownBy(() -> authService.changePassword(request))
            .isInstanceOf(RegistrationException.class)
            .hasMessageContaining("Ancien mot de passe incorrect");
    }
}
