package com.cabinet.medical.controller;

import com.cabinet.medical.dto.request.DossierRemboursementRequest;
import com.cabinet.medical.dto.response.ApiResponse;
import com.cabinet.medical.dto.response.DossierRemboursementResponse;
import com.cabinet.medical.enums.StatutDossier;
import com.cabinet.medical.service.DossierRemboursementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/dossiers")
@RequiredArgsConstructor
public class DossierRemboursementController {

    private final DossierRemboursementService dossierService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE')")
    public ResponseEntity<ApiResponse<Page<DossierRemboursementResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) StatutDossier statut) {
        Page<DossierRemboursementResponse> data = statut != null
            ? dossierService.getByStatut(statut, PageRequest.of(page, size))
            : dossierService.getAll(PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(data, "Dossiers récupérés", 200));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE')")
    public ResponseEntity<ApiResponse<DossierRemboursementResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(dossierService.getById(id), "Dossier trouvé", 200));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE')")
    public ResponseEntity<ApiResponse<DossierRemboursementResponse>> create(
            @Valid @RequestBody DossierRemboursementRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(dossierService.createDossier(request), "Dossier créé", 201));
    }

    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE')")
    public ResponseEntity<ApiResponse<DossierRemboursementResponse>> changerStatut(
            @PathVariable Long id, @RequestParam StatutDossier statut) {
        return ResponseEntity.ok(ApiResponse.success(
            dossierService.changerStatut(id, statut), "Statut mis à jour", 200));
    }

    @GetMapping("/patient/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE')")
    public ResponseEntity<ApiResponse<Page<DossierRemboursementResponse>>> getByPatient(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
            dossierService.getByPatient(id, PageRequest.of(page, size)), "Dossiers du patient", 200));
    }
}
