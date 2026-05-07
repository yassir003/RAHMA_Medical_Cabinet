package com.cabinet.medical.controller;

import com.cabinet.medical.dto.request.ConsultationRequest;
import com.cabinet.medical.dto.response.ApiResponse;
import com.cabinet.medical.dto.response.ConsultationResponse;
import com.cabinet.medical.service.ConsultationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/consultations")
@RequiredArgsConstructor
public class ConsultationController {

    private final ConsultationService consultationService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN')")
    public ResponseEntity<ApiResponse<Page<ConsultationResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
            consultationService.getAll(PageRequest.of(page, size)), "Consultations récupérées", 200));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE','PATIENT')")
    public ResponseEntity<ApiResponse<ConsultationResponse>> getById(
            @PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
            consultationService.getByIdForRole(id, authentication), "Consultation trouvée", 200));
    }

    @PostMapping
    @PreAuthorize("hasRole('MEDECIN')")
    public ResponseEntity<ApiResponse<ConsultationResponse>> create(@Valid @RequestBody ConsultationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(consultationService.create(request), "Consultation créée", 201));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MEDECIN')")
    public ResponseEntity<ApiResponse<ConsultationResponse>> update(@PathVariable Long id,
                                                                    @Valid @RequestBody ConsultationRequest request) {
        return ResponseEntity.ok(ApiResponse.success(consultationService.update(id, request), "Consultation mise à jour", 200));
    }

    @GetMapping("/patient/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE')")
    public ResponseEntity<ApiResponse<Page<ConsultationResponse>>> getByPatient(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
            consultationService.getByPatient(id, PageRequest.of(page, size)), "Consultations du patient", 200));
    }

    @GetMapping("/medecin/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN')")
    public ResponseEntity<ApiResponse<Page<ConsultationResponse>>> getByMedecin(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
            consultationService.getByMedecin(id, PageRequest.of(page, size)), "Consultations du médecin", 200));
    }

    /** GET /consultations/medecin/me — all consultations for the authenticated médecin */
    @GetMapping("/medecin/me")
    @PreAuthorize("hasRole('MEDECIN')")
    public ResponseEntity<ApiResponse<Page<ConsultationResponse>>> getMyConsultations(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageRequest pr = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "dateVisite"));
        return ResponseEntity.ok(ApiResponse.success(
            consultationService.getByMedecinEmail(authentication.getName(), pr),
            "Mes consultations", 200));
    }
}
