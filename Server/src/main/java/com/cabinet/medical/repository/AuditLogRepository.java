package com.cabinet.medical.repository;

import com.cabinet.medical.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findByTimestampBetween(LocalDateTime debut, LocalDateTime fin, Pageable pageable);
}
