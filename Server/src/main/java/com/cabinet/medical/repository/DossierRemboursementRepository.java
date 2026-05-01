package com.cabinet.medical.repository;

import com.cabinet.medical.entity.DossierRemboursement;
import com.cabinet.medical.enums.StatutDossier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface DossierRemboursementRepository extends JpaRepository<DossierRemboursement, Long> {
    Page<DossierRemboursement> findByPatientId(Long patientId, Pageable pageable);
    Page<DossierRemboursement> findByStatut(StatutDossier statut, Pageable pageable);
}
