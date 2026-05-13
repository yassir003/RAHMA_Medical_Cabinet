package com.cabinet.medical.service;

import com.cabinet.medical.dto.request.MedecinRequest;
import com.cabinet.medical.dto.response.MedecinResponse;
import com.cabinet.medical.entity.Medecin;
import com.cabinet.medical.entity.User;
import com.cabinet.medical.enums.Role;
import com.cabinet.medical.exception.ResourceNotFoundException;
import com.cabinet.medical.mapper.MedecinMapper;
import com.cabinet.medical.repository.MedecinRepository;
import com.cabinet.medical.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("MedecinService")
class MedecinServiceTest {

    @Mock
    private MedecinRepository medecinRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private MedecinMapper medecinMapper;
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private MedecinService medecinService;

    @Test
    @DisplayName("should return all doctors when search is blank")
    void shouldReturnAllDoctorsWhenSearchIsBlank() {
        Medecin medecin = medecin(1L);
        MedecinResponse expected = response(1L);
        PageRequest pageable = PageRequest.of(0, 10);

        when(medecinRepository.findAll(pageable)).thenReturn(new PageImpl<>(List.of(medecin), pageable, 1));
        when(medecinMapper.toResponse(medecin)).thenReturn(expected);

        var result = medecinService.getAll(" ", pageable);

        assertThat(result.getContent()).containsExactly(expected);
        verify(medecinRepository).findAll(pageable);
    }

    @Test
    @DisplayName("should search doctors when search has text")
    void shouldSearchDoctorsWhenSearchHasText() {
        Medecin medecin = medecin(2L);
        MedecinResponse expected = response(2L);
        PageRequest pageable = PageRequest.of(0, 5);

        when(medecinRepository.findByNomContainingOrPrenomContainingOrSpecialiteContaining(
            "cardio", "cardio", "cardio", pageable))
            .thenReturn(new PageImpl<>(List.of(medecin), pageable, 1));
        when(medecinMapper.toResponse(medecin)).thenReturn(expected);

        var result = medecinService.getAll("cardio", pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getSpecialite()).isEqualTo("Cardiology");
    }

    @Test
    @DisplayName("should create doctor when request is valid")
    void shouldCreateDoctorWhenRequestIsValid() {
        MedecinRequest request = medecinRequest();
        Medecin saved = medecin(3L);
        MedecinResponse expected = response(3L);

        when(passwordEncoder.encode("Password123")).thenReturn("encoded-password");
        when(medecinRepository.save(any(Medecin.class))).thenReturn(saved);
        when(medecinMapper.toResponse(saved)).thenReturn(expected);

        MedecinResponse response = medecinService.create(request);

        assertThat(response).isEqualTo(expected);
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertThat(userCaptor.getValue().getRole()).isEqualTo(Role.MEDECIN);
        assertThat(userCaptor.getValue().getPassword()).isEqualTo("encoded-password");
    }

    @Test
    @DisplayName("should update doctor when doctor exists")
    void shouldUpdateDoctorWhenDoctorExists() {
        Medecin medecin = medecin(4L);
        MedecinRequest request = medecinRequest();
        request.setSpecialite("Dermatology");
        MedecinResponse expected = response(4L);
        expected.setSpecialite("Dermatology");

        when(medecinRepository.findById(4L)).thenReturn(Optional.of(medecin));
        when(medecinRepository.save(medecin)).thenReturn(medecin);
        when(medecinMapper.toResponse(medecin)).thenReturn(expected);

        MedecinResponse response = medecinService.update(4L, request);

        assertThat(response.getSpecialite()).isEqualTo("Dermatology");
        assertThat(medecin.getSpecialite()).isEqualTo("Dermatology");
    }

    @Test
    @DisplayName("should throw not found when doctor does not exist")
    void shouldThrowNotFoundWhenDoctorDoesNotExist() {
        when(medecinRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> medecinService.getById(99L))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("99");
    }

    @Test
    @DisplayName("should return current doctor when email belongs to doctor user")
    void shouldReturnCurrentDoctorWhenEmailBelongsToDoctorUser() {
        User user = user(20L, "doctor@mail.com", Role.MEDECIN);
        Medecin medecin = medecin(5L);
        MedecinResponse expected = response(5L);

        when(userRepository.findByEmail("doctor@mail.com")).thenReturn(Optional.of(user));
        when(medecinRepository.findByUserId(20L)).thenReturn(Optional.of(medecin));
        when(medecinMapper.toResponse(medecin)).thenReturn(expected);

        MedecinResponse response = medecinService.getMe("doctor@mail.com");

        assertThat(response.getId()).isEqualTo(5L);
    }

    private MedecinRequest medecinRequest() {
        MedecinRequest request = new MedecinRequest();
        request.setNom("House");
        request.setPrenom("Gregory");
        request.setSpecialite("Cardiology");
        request.setTelephone("0700000000");
        request.setEmail("doctor@mail.com");
        request.setPassword("Password123");
        return request;
    }

    private User user(Long id, String email, Role role) {
        return User.builder()
            .id(id)
            .email(email)
            .password("encoded-password")
            .role(role)
            .enabled(true)
            .build();
    }

    private Medecin medecin(Long id) {
        return Medecin.builder()
            .id(id)
            .nom("House")
            .prenom("Gregory")
            .specialite("Cardiology")
            .telephone("0700000000")
            .user(user(100L + id, "doctor" + id + "@mail.com", Role.MEDECIN))
            .build();
    }

    private MedecinResponse response(Long id) {
        MedecinResponse response = new MedecinResponse();
        response.setId(id);
        response.setNom("House");
        response.setPrenom("Gregory");
        response.setSpecialite("Cardiology");
        response.setTelephone("0700000000");
        response.setEmail("doctor@mail.com");
        return response;
    }
}
