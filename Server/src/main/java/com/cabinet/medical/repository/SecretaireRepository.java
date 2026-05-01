package com.cabinet.medical.repository;

import com.cabinet.medical.entity.Secretaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Optional;

public interface SecretaireRepository extends JpaRepository<Secretaire, Long> {
    Optional<Secretaire> findByUserId(Long userId);
    Page<Secretaire> findByNomContainingOrPrenomContaining(String nom, String prenom, Pageable pageable);
}
