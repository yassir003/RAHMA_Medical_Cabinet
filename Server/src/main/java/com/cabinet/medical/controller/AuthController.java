package com.cabinet.medical.controller;

import com.cabinet.medical.dto.request.LoginRequest;
import com.cabinet.medical.dto.request.RegisterRequest;
import com.cabinet.medical.dto.response.ApiResponse;
import com.cabinet.medical.dto.response.AuthResponse;
import com.cabinet.medical.service.AuthService;
import io.github.resilience4j.ratelimiter.RequestNotPermitted;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse auth = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(auth, "Inscription réussie", 201));
    }

    @PostMapping("/login")
    @RateLimiter(name = "authService", fallbackMethod = "rateLimitFallback")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse auth = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(auth, "Connexion réussie", 200));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        return ResponseEntity.ok(ApiResponse.success(null, "Déconnexion réussie", 200));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@RequestParam String email) {
        return ResponseEntity.ok(ApiResponse.success(null, "Email de réinitialisation envoyé", 200));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@RequestParam String token,
                                                            @RequestParam String newPassword) {
        return ResponseEntity.ok(ApiResponse.success(null, "Mot de passe réinitialisé", 200));
    }

    public ResponseEntity<ApiResponse<AuthResponse>> rateLimitFallback(LoginRequest request, RequestNotPermitted ex) {
        return ResponseEntity.status(429)
            .body(ApiResponse.error("Trop de tentatives de connexion. Réessayez dans 1 minute.", 429));
    }
}
