package com.cabinet.medical.repository;

import com.cabinet.medical.entity.Ordonnance;
import com.cabinet.medical.enums.StatutOrdonnance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OrdonnanceRepository extends JpaRepository<Ordonnance, Long> {
    Page<Ordonnance> findByPatientId(Long patientId, Pageable pageable);
    Page<Ordonnance> findByMedecinId(Long medecinId, Pageable pageable);
    Page<Ordonnance> findByPatientUserEmail(String email, Pageable pageable);
    Page<Ordonnance> findByMedecinUserEmail(String email, Pageable pageable);
    Optional<Ordonnance> findByConsultationId(Long consultationId);
    Page<Ordonnance> findByStatut(StatutOrdonnance statut, Pageable pageable);
    Page<Ordonnance> findByPatientIdAndStatut(Long patientId, StatutOrdonnance statut, Pageable pageable);
    Page<Ordonnance> findByPatientUserEmailAndStatut(String email, StatutOrdonnance statut, Pageable pageable);
    Page<Ordonnance> findByMedecinUserEmailAndStatut(String email, StatutOrdonnance statut, Pageable pageable);
}
