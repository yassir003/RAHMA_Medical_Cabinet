package com.cabinet.medical.controller;

import com.cabinet.medical.dto.request.RendezVousRequest;
import com.cabinet.medical.dto.response.ApiResponse;
import com.cabinet.medical.dto.response.RendezVousResponse;
import com.cabinet.medical.enums.StatutRdv;
import com.cabinet.medical.service.RendezVousService;
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
@RequestMapping("/api/v1/rendez-vous")
@RequiredArgsConstructor
public class RendezVousController {

    private final RendezVousService rendezVousService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE','MEDECIN')")
    public ResponseEntity<ApiResponse<Page<RendezVousResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "dateHeure") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {
        Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        return ResponseEntity.ok(ApiResponse.success(
            rendezVousService.getAll(PageRequest.of(page, size, sort)), "Rendez-vous récupérés", 200));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE','MEDECIN')")
    public ResponseEntity<ApiResponse<RendezVousResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(rendezVousService.getById(id), "Rendez-vous trouvé", 200));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE','PATIENT')")
    public ResponseEntity<ApiResponse<RendezVousResponse>> create(@Valid @RequestBody RendezVousRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(rendezVousService.creerRendezVous(request), "Rendez-vous créé", 201));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE')")
    public ResponseEntity<ApiResponse<RendezVousResponse>> update(@PathVariable Long id,
                                                                  @Valid @RequestBody RendezVousRequest request) {
        return ResponseEntity.ok(ApiResponse.success(rendezVousService.update(id, request), "Rendez-vous mis à jour", 200));
    }

    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE','MEDECIN')")
    public ResponseEntity<ApiResponse<RendezVousResponse>> changerStatut(@PathVariable Long id,
                                                                          @RequestParam StatutRdv statut) {
        return ResponseEntity.ok(ApiResponse.success(rendezVousService.changerStatut(id, statut), "Statut mis à jour", 200));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        rendezVousService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Rendez-vous supprimé", 200));
    }
}
