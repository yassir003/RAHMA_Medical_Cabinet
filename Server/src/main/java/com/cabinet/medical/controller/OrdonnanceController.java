package com.cabinet.medical.controller;

import com.cabinet.medical.dto.request.OrdonnanceRequest;
import com.cabinet.medical.dto.response.ApiResponse;
import com.cabinet.medical.dto.response.OrdonnanceResponse;
import com.cabinet.medical.enums.Role;
import com.cabinet.medical.enums.StatutOrdonnance;
import com.cabinet.medical.service.OrdonnanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ordonnances")
@RequiredArgsConstructor
public class OrdonnanceController {

    private final OrdonnanceService ordonnanceService;

    @PostMapping
    @PreAuthorize("hasRole('MEDECIN')")
    public ResponseEntity<ApiResponse<OrdonnanceResponse>> create(
            @Valid @RequestBody OrdonnanceRequest request,
            Authentication auth) {
        OrdonnanceResponse response = ordonnanceService.create(request, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(response, "Ordonnance creee", 201));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE','PATIENT')")
    public ResponseEntity<ApiResponse<Page<OrdonnanceResponse>>> getAll(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) StatutOrdonnance statut,
            @RequestParam(required = false) String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "dateCreation"));
        Role role = getCurrentRole(auth);
        return ResponseEntity.ok(ApiResponse.success(
            ordonnanceService.getForRole(auth.getName(), role, statut, search, pageable),
            "Ordonnances recuperees",
            200));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE','PATIENT')")
    public ResponseEntity<ApiResponse<OrdonnanceResponse>> getById(
            @PathVariable Long id,
            Authentication auth) {
        Role role = getCurrentRole(auth);
        return ResponseEntity.ok(ApiResponse.success(
            ordonnanceService.getByIdForRole(id, auth.getName(), role),
            "Ordonnance trouvee",
            200));
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE','PATIENT')")
    public ResponseEntity<ApiResponse<Page<OrdonnanceResponse>>> getByPatient(
            @PathVariable Long patientId,
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "dateCreation"));
        Role role = getCurrentRole(auth);
        return ResponseEntity.ok(ApiResponse.success(
            ordonnanceService.getByPatientIdForRole(patientId, auth.getName(), role, pageable),
            "Ordonnances du patient",
            200));
    }

    @PatchMapping("/{id}/annuler")
    @PreAuthorize("hasRole('MEDECIN')")
    public ResponseEntity<ApiResponse<OrdonnanceResponse>> annuler(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
            ordonnanceService.annuler(id, auth.getName()),
            "Ordonnance annulee",
            200));
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE','PATIENT')")
    public ResponseEntity<byte[]> downloadPdf(
            @PathVariable Long id,
            Authentication auth) {
        Role role = getCurrentRole(auth);
        byte[] pdf = ordonnanceService.generatePdf(id, auth.getName(), role);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=ordonnance-" + id + ".pdf")
            .contentType(MediaType.APPLICATION_PDF)
            .body(pdf);
    }

    private Role getCurrentRole(Authentication auth) {
        return auth.getAuthorities().stream()
            .map(authority -> authority.getAuthority().replace("ROLE_", ""))
            .map(Role::valueOf)
            .findFirst()
            .orElseThrow();
    }
}
