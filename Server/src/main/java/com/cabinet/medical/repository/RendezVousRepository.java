package com.cabinet.medical.repository;

import com.cabinet.medical.entity.RendezVous;
import com.cabinet.medical.enums.StatutRdv;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;
import java.util.List;

public interface RendezVousRepository extends JpaRepository<RendezVous, Long> {
    Page<RendezVous> findByMedecinIdAndDateHeureBetween(
        Long medecinId, LocalDateTime debut, LocalDateTime fin, Pageable pageable);
    boolean existsByMedecinIdAndDateHeureBetweenAndStatutNot(
        Long medecinId, LocalDateTime debut, LocalDateTime fin, StatutRdv statut);
    List<RendezVous> findByMedecinIdAndDateHeureBetweenAndStatutNot(
        Long medecinId, LocalDateTime debut, LocalDateTime fin, StatutRdv statut);
    Page<RendezVous> findByStatut(StatutRdv statut, Pageable pageable);
    Page<RendezVous> findByPatientId(Long patientId, Pageable pageable);
    Page<RendezVous> findByPatient_User_Email(String email, Pageable pageable);
    Page<RendezVous> findByMedecinId(Long medecinId, Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT MONTH(r.dateHeure), r.statut, COUNT(r) FROM RendezVous r WHERE YEAR(r.dateHeure) = YEAR(CURRENT_DATE) GROUP BY MONTH(r.dateHeure), r.statut")
    java.util.List<Object[]> countRendezVousParMoisEtStatut();
}
