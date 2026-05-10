package com.cabinet.medical.security;

import com.cabinet.medical.entity.User;
import com.cabinet.medical.enums.Role;
import com.cabinet.medical.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CustomUserDetailsService customUserDetailsService;

    @Test
    void shouldLoadUserByUsername() {
        User user = User.builder()
            .id(1L)
            .email("user@mail.com")
            .password("password")
            .role(Role.ADMIN)
            .enabled(true)
            .build();
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

        var result = customUserDetailsService.loadUserByUsername(user.getEmail());

        assertThat(result.getUsername()).isEqualTo(user.getEmail());
    }

    @Test
    void shouldThrowExceptionWhenUserDoesNotExist() {
        when(userRepository.findByEmail("missing@mail.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> customUserDetailsService.loadUserByUsername("missing@mail.com"))
            .isInstanceOf(UsernameNotFoundException.class)
            .hasMessageContaining("Utilisateur non trouvé");
    }
}
