package com.cabinet.medical.controller;

import com.cabinet.medical.dto.request.PatientRequest;
import com.cabinet.medical.dto.response.ApiResponse;
import com.cabinet.medical.dto.response.ConsultationResponse;
import com.cabinet.medical.dto.response.PatientResponse;
import com.cabinet.medical.dto.response.RendezVousResponse;
import com.cabinet.medical.service.ConsultationService;
import com.cabinet.medical.service.PatientService;
import com.cabinet.medical.service.RendezVousService;
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
@RequestMapping("/api/v1/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;
    private final ConsultationService consultationService;
    private final RendezVousService rendezVousService;

    // ── Patient "me" endpoints ────────────────────────────────────────────────

    @GetMapping("/me")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<PatientResponse>> getMe(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
            patientService.getMe(auth.getName()), "Profil récupéré", 200));
    }

    @GetMapping("/me/rendez-vous")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<Page<RendezVousResponse>>> getMyRendezVous(
            Authentication auth,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pr = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "dateHeure"));
        return ResponseEntity.ok(ApiResponse.success(
            rendezVousService.getMyRdvs(auth.getName(), pr), "Rendez-vous récupérés", 200));
    }

    @PatchMapping("/me")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<PatientResponse>> updateMe(
            Authentication auth,
            @RequestBody PatientRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
            patientService.updateMe(auth.getName(), request), "Profil mis à jour", 200));
    }

    @GetMapping("/me/consultations")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<Page<ConsultationResponse>>> getMyConsultations(
            Authentication auth,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        PatientResponse me = patientService.getMe(auth.getName());
        return ResponseEntity.ok(ApiResponse.success(
            consultationService.getByPatient(me.getId(), PageRequest.of(page, size)),
            "Consultations récupérées", 200));
    }

    // ── Standard CRUD ─────────────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE','MEDECIN')")
    public ResponseEntity<ApiResponse<Page<PatientResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String direction,
            @RequestParam(required = false) String search) {
        Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        return ResponseEntity.ok(ApiResponse.success(
            patientService.getAllPatients(search, PageRequest.of(page, size, sort)), "Patients récupérés", 200));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE','MEDECIN','PATIENT')")
    public ResponseEntity<ApiResponse<PatientResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(patientService.getById(id), "Patient trouvé", 200));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE')")
    public ResponseEntity<ApiResponse<PatientResponse>> create(@Valid @RequestBody PatientRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(patientService.create(request), "Patient créé", 201));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE')")
    public ResponseEntity<ApiResponse<PatientResponse>> update(@PathVariable Long id,
                                                               @Valid @RequestBody PatientRequest request) {
        return ResponseEntity.ok(ApiResponse.success(patientService.update(id, request), "Patient mis à jour", 200));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        patientService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Patient supprimé", 200));
    }

    @GetMapping("/{id}/consultations")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE','MEDECIN')")
    public ResponseEntity<ApiResponse<Page<ConsultationResponse>>> getConsultations(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
            consultationService.getByPatient(id, PageRequest.of(page, size)), "Consultations récupérées", 200));
    }

    @GetMapping("/{id}/rendez-vous")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE','MEDECIN')")
    public ResponseEntity<ApiResponse<Page<RendezVousResponse>>> getRendezVous(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
            rendezVousService.getByPatient(id, PageRequest.of(page, size)), "Rendez-vous récupérés", 200));
    }
}
