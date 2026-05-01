package com.cabinet.medical.service;

import com.cabinet.medical.entity.AuditLog;
import com.cabinet.medical.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public void log(String action, String entite, Long entiteId, String utilisateur, String details) {
        AuditLog log = AuditLog.builder()
            .action(action)
            .entite(entite)
            .entiteId(entiteId)
            .utilisateur(utilisateur)
            .timestamp(LocalDateTime.now())
            .details(details)
            .build();
        auditLogRepository.save(log);
    }

    public Page<AuditLog> findAll(Pageable pageable) {
        return auditLogRepository.findAll(pageable);
    }

    public Page<AuditLog> findByPeriode(LocalDateTime debut, LocalDateTime fin, Pageable pageable) {
        return auditLogRepository.findByTimestampBetween(debut, fin, pageable);
    }
}
