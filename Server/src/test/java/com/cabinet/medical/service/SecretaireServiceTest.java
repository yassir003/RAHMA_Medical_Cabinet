package com.cabinet.medical.service;

import com.cabinet.medical.dto.request.SecretaireRequest;
import com.cabinet.medical.dto.response.SecretaireResponse;
import com.cabinet.medical.entity.Secretaire;
import com.cabinet.medical.entity.User;
import com.cabinet.medical.enums.Role;
import com.cabinet.medical.exception.ResourceNotFoundException;
import com.cabinet.medical.mapper.SecretaireMapper;
import com.cabinet.medical.repository.SecretaireRepository;
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
@DisplayName("SecretaireService")
class SecretaireServiceTest {

    @Mock
    private SecretaireRepository secretaireRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private SecretaireMapper secretaireMapper;

    @InjectMocks
    private SecretaireService secretaireService;

    @Test
    @DisplayName("should return all secretaries when search is blank")
    void shouldReturnAllSecretariesWhenSearchIsBlank() {
        Secretaire secretaire = secretaire(1L);
        SecretaireResponse expected = response(1L);
        PageRequest pageable = PageRequest.of(0, 10);

        when(secretaireRepository.findAll(pageable)).thenReturn(new PageImpl<>(List.of(secretaire), pageable, 1));
        when(secretaireMapper.toResponse(secretaire)).thenReturn(expected);

        var result = secretaireService.getAll(null, pageable);

        assertThat(result.getContent()).containsExactly(expected);
    }

    @Test
    @DisplayName("should search secretaries when search has text")
    void shouldSearchSecretariesWhenSearchHasText() {
        Secretaire secretaire = secretaire(2L);
        SecretaireResponse expected = response(2L);
        PageRequest pageable = PageRequest.of(0, 10);

        when(secretaireRepository.findByNomContainingOrPrenomContaining("amal", "amal", pageable))
            .thenReturn(new PageImpl<>(List.of(secretaire), pageable, 1));
        when(secretaireMapper.toResponse(secretaire)).thenReturn(expected);

        var result = secretaireService.getAll("amal", pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getNom()).isEqualTo("Secretary");
    }

    @Test
    @DisplayName("should create secretary when request is valid")
    void shouldCreateSecretaryWhenRequestIsValid() {
        SecretaireRequest request = request();
        Secretaire saved = secretaire(3L);
        SecretaireResponse expected = response(3L);

        when(passwordEncoder.encode("Password123")).thenReturn("encoded-password");
        when(secretaireRepository.save(any(Secretaire.class))).thenReturn(saved);
        when(secretaireMapper.toResponse(saved)).thenReturn(expected);

        SecretaireResponse actual = secretaireService.create(request);

        assertThat(actual).isEqualTo(expected);
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertThat(userCaptor.getValue().getRole()).isEqualTo(Role.SECRETAIRE);
    }

    @Test
    @DisplayName("should update secretary when secretary exists")
    void shouldUpdateSecretaryWhenSecretaryExists() {
        Secretaire secretaire = secretaire(4L);
        SecretaireRequest request = request();
        request.setTelephone("0611111111");
        SecretaireResponse expected = response(4L);
        expected.setTelephone("0611111111");

        when(secretaireRepository.findById(4L)).thenReturn(Optional.of(secretaire));
        when(secretaireRepository.save(secretaire)).thenReturn(secretaire);
        when(secretaireMapper.toResponse(secretaire)).thenReturn(expected);

        SecretaireResponse actual = secretaireService.update(4L, request);

        assertThat(actual.getTelephone()).isEqualTo("0611111111");
        assertThat(secretaire.getTelephone()).isEqualTo("0611111111");
    }

    @Test
    @DisplayName("should delete secretary and linked user when secretary exists")
    void shouldDeleteSecretaryAndLinkedUserWhenSecretaryExists() {
        Secretaire secretaire = secretaire(5L);
        when(secretaireRepository.findById(5L)).thenReturn(Optional.of(secretaire));

        secretaireService.delete(5L);

        verify(secretaireRepository).deleteById(5L);
        verify(userRepository).delete(secretaire.getUser());
    }

    @Test
    @DisplayName("should throw not found when secretary does not exist")
    void shouldThrowNotFoundWhenSecretaryDoesNotExist() {
        when(secretaireRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> secretaireService.getById(99L))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("99");
    }

    private SecretaireRequest request() {
        SecretaireRequest request = new SecretaireRequest();
        request.setNom("Secretary");
        request.setPrenom("Amal");
        request.setTelephone("0600000000");
        request.setEmail("secretary@mail.com");
        request.setPassword("Password123");
        return request;
    }

    private Secretaire secretaire(Long id) {
        return Secretaire.builder()
            .id(id)
            .nom("Secretary")
            .prenom("Amal")
            .telephone("0600000000")
            .user(User.builder().id(30L).email("secretary@mail.com").role(Role.SECRETAIRE).build())
            .build();
    }

    private SecretaireResponse response(Long id) {
        return SecretaireResponse.builder()
            .id(id)
            .nom("Secretary")
            .prenom("Amal")
            .telephone("0600000000")
            .email("secretary@mail.com")
            .build();
    }
}
