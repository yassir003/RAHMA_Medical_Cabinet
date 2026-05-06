package com.cabinet.medical.repository;

import com.cabinet.medical.entity.Notification;
import com.cabinet.medical.entity.Patient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByPatientOrderByDateCreationDesc(Patient patient, Pageable pageable);

    long countByPatientAndLuFalse(Patient patient);

    @Modifying
    @Query("UPDATE Notification n SET n.lu = true WHERE n.patient = :patient AND n.lu = false")
    void markAllAsReadByPatient(@Param("patient") Patient patient);
}
