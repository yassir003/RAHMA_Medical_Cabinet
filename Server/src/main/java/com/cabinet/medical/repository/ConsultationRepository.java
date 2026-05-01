package com.cabinet.medical.repository;

import com.cabinet.medical.entity.Consultation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;

public interface ConsultationRepository extends JpaRepository<Consultation, Long> {
    Page<Consultation> findByPatientId(Long patientId, Pageable pageable);
    Page<Consultation> findByMedecinId(Long medecinId, Pageable pageable);
    Page<Consultation> findByMedecinIdAndDateVisiteBetween(
        Long medecinId, LocalDateTime debut, LocalDateTime fin, Pageable pageable);
    long countByMedecinId(Long medecinId);
}
