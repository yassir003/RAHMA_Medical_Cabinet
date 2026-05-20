package com.cabinet.medical.controller;

import com.cabinet.medical.dto.request.SecretaireRequest;
import com.cabinet.medical.dto.request.SecretaireUpdateRequest;
import com.cabinet.medical.dto.response.ApiResponse;
import com.cabinet.medical.dto.response.SecretaireResponse;
import com.cabinet.medical.service.SecretaireService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/secretaires")
@RequiredArgsConstructor
public class SecretaireController {

    private final SecretaireService secretaireService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<SecretaireResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String direction,
            @RequestParam(required = false) String search) {
        Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Page<SecretaireResponse> responsePage = secretaireService.getAll(search, PageRequest.of(page, size, sort));
        return ResponseEntity.ok(ApiResponse.success(responsePage, "Secrétaires récupérés", 200));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SecretaireResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(secretaireService.getById(id), "Secrétaire trouvé", 200));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SecretaireResponse>> create(@Valid @RequestBody SecretaireRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(secretaireService.create(request), "Secrétaire créé", 201));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SecretaireResponse>> update(@PathVariable Long id,
                                                               @Valid @RequestBody SecretaireUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(secretaireService.update(id, request), "Secrétaire mis à jour", 200));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        secretaireService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Secrétaire supprimé", 200));
    }
}
