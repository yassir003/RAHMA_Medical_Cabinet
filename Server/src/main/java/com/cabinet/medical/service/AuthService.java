package com.cabinet.medical.service;

import com.cabinet.medical.dto.request.LoginRequest;
import com.cabinet.medical.dto.response.AuthResponse;
import com.cabinet.medical.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthResponse login(LoginRequest request) {
        Authentication auth = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        UserDetails userDetails = (UserDetails) auth.getPrincipal();
        String token = jwtTokenProvider.generateToken(userDetails);
        String role = userDetails.getAuthorities().stream()
            .findFirst().map(a -> a.getAuthority().replace("ROLE_", "")).orElse("");
        return AuthResponse.builder()
            .token(token)
            .type("Bearer")
            .email(userDetails.getUsername())
            .role(role)
            .build();
    }
}
