package com.cabinet.medical.repository;

import com.cabinet.medical.entity.LigneMedicament;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LigneMedicamentRepository extends JpaRepository<LigneMedicament, Long> {
    List<LigneMedicament> findByOrdonnanceId(Long ordonnanceId);
    void deleteByOrdonnanceId(Long ordonnanceId);
}
