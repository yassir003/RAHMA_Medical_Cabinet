package com.cabinet.medical.repository;

import com.cabinet.medical.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    Page<Patient> findByNomContainingOrPrenomContainingOrCinContaining(
        String nom, String prenom, String cin, Pageable pageable);
    Optional<Patient> findByCin(String cin);
    Optional<Patient> findByUserId(Long userId);
    Optional<Patient> findByUser_Email(String email);

    /**
     * Returns patients who have had at least one consultation OR one appointment
     * with the given doctor, optionally filtered by name/CIN search term.
     */
    @Query("SELECT DISTINCT p FROM Patient p WHERE " +
           "(EXISTS (SELECT 1 FROM Consultation c WHERE c.medecin.id = :medecinId AND c.patient = p) OR " +
           " EXISTS (SELECT 1 FROM RendezVous r  WHERE r.medecin.id  = :medecinId AND r.patient = p)) AND " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(p.nom)    LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(p.prenom) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(p.cin)    LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Patient> findPatientsByMedecinId(
        @Param("medecinId") Long medecinId,
        @Param("search")    String search,
        Pageable pageable);
}