package com.cabinet.medical.repository;

import com.cabinet.medical.entity.Mutuelle;
import com.cabinet.medical.enums.TypeMutuelle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.Optional;
import java.util.List;

public interface MutuelleRepository extends JpaRepository<Mutuelle, Long> {
    Optional<Mutuelle> findByPatientId(Long patientId);

    @Query("SELECT m.type, COUNT(m) FROM Mutuelle m GROUP BY m.type")
    List<Object[]> countByType();
}
