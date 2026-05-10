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
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

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

    /** GET /rendez-vous/medecin/me — appointments for the authenticated médecin only */
    @GetMapping("/medecin/me")
    @PreAuthorize("hasRole('MEDECIN')")
    public ResponseEntity<ApiResponse<Page<RendezVousResponse>>> getMyRdvs(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size,
            @RequestParam(defaultValue = "dateHeure") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        return ResponseEntity.ok(ApiResponse.success(
            rendezVousService.getByMedecinEmail(authentication.getName(), PageRequest.of(page, size, sort)),
            "Mes rendez-vous", 200));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE','MEDECIN','PATIENT')")
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
    public ResponseEntity<ApiResponse<RendezVousResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody RendezVousRequest request) {
        return ResponseEntity.ok(ApiResponse.success(rendezVousService.update(id, request), "Rendez-vous mis à jour", 200));
    }

    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE','MEDECIN')")
    public ResponseEntity<ApiResponse<RendezVousResponse>> changerStatut(
            @PathVariable Long id,
            @RequestParam StatutRdv statut) {
        return ResponseEntity.ok(ApiResponse.success(rendezVousService.changerStatut(id, statut), "Statut mis à jour", 200));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        rendezVousService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Rendez-vous supprimé", 200));
    }

    @PatchMapping("/{id}/annuler")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<RendezVousResponse>> annulerMien(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
            rendezVousService.annulerMien(id, auth.getName()), "Rendez-vous annulé", 200));
    }

    @GetMapping("/disponibilites/{medecinId}")
    public ResponseEntity<ApiResponse<List<String>>> getDisponibilites(
            @PathVariable Long medecinId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.success(
            rendezVousService.getDisponibilites(medecinId, date), "Disponibilités récupérées", 200));
    }
}
