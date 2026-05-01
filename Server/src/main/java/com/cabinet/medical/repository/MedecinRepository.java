package com.cabinet.medical.repository;

import com.cabinet.medical.entity.Medecin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Optional;

public interface MedecinRepository extends JpaRepository<Medecin, Long> {
    Optional<Medecin> findByUserId(Long userId);
    Page<Medecin> findByNomContainingOrPrenomContainingOrSpecialiteContaining(
        String nom, String prenom, String specialite, Pageable pageable);
}
