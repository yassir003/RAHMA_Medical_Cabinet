package com.cabinet.medical.controller;

import com.cabinet.medical.dto.request.MutuelleRequest;
import com.cabinet.medical.dto.response.ApiResponse;
import com.cabinet.medical.dto.response.MutuelleResponse;
import com.cabinet.medical.service.MutuelleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/mutuelles")
@RequiredArgsConstructor
public class MutuelleController {

    private final MutuelleService mutuelleService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE')")
    public ResponseEntity<ApiResponse<Page<MutuelleResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
            mutuelleService.getAll(PageRequest.of(page, size)), "Mutuelles récupérées", 200));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE')")
    public ResponseEntity<ApiResponse<MutuelleResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(mutuelleService.getById(id), "Mutuelle trouvée", 200));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE')")
    public ResponseEntity<ApiResponse<MutuelleResponse>> create(@Valid @RequestBody MutuelleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(mutuelleService.create(request), "Mutuelle créée", 201));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE')")
    public ResponseEntity<ApiResponse<MutuelleResponse>> update(@PathVariable Long id,
                                                                @Valid @RequestBody MutuelleRequest request) {
        return ResponseEntity.ok(ApiResponse.success(mutuelleService.update(id, request), "Mutuelle mise à jour", 200));
    }

    @GetMapping("/patient/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE','MEDECIN')")
    public ResponseEntity<ApiResponse<MutuelleResponse>> getByPatient(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(mutuelleService.getByPatient(id), "Mutuelle du patient", 200));
    }
}
