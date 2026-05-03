package com.cabinet.medical.repository;

import com.cabinet.medical.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    Page<Patient> findByNomContainingOrPrenomContainingOrCinContaining(
        String nom, String prenom, String cin, Pageable pageable);
    Optional<Patient> findByCin(String cin);
    Optional<Patient> findByUserId(Long userId);
    Optional<Patient> findByUser_Email(String email);
}
