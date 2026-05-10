package com.cabinet.medical.security;

import com.cabinet.medical.entity.User;
import com.cabinet.medical.enums.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(jwtTokenProvider, "secret", "abcdefghijklmnopqrstuvwxyz123456");
        ReflectionTestUtils.setField(jwtTokenProvider, "expiration", 3_600_000L);
    }

    @Test
    void shouldGenerateAndValidateToken() {
        User user = User.builder()
            .id(1L)
            .email("user@mail.com")
            .password("password")
            .role(Role.PATIENT)
            .passwordChanged(true)
            .enabled(true)
            .build();

        String token = jwtTokenProvider.generateToken(user);

        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
        assertThat(jwtTokenProvider.getUsernameFromToken(token)).isEqualTo(user.getEmail());
    }

    @Test
    void shouldRejectInvalidToken() {
        assertThat(jwtTokenProvider.validateToken("invalid-token")).isFalse();
    }
}
