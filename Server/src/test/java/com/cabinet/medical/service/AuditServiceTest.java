package com.cabinet.medical.service;

import com.cabinet.medical.entity.AuditLog;
import com.cabinet.medical.repository.AuditLogRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuditService")
class AuditServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private AuditService auditService;

    @Test
    @DisplayName("should save audit log when log is called")
    void shouldSaveAuditLogWhenLogIsCalled() {
        ArgumentCaptor<AuditLog> logCaptor = ArgumentCaptor.forClass(AuditLog.class);
        when(auditLogRepository.save(logCaptor.capture())).thenAnswer(invocation -> {
            AuditLog log = invocation.getArgument(0);
            log.setId(1L);
            return log;
        });

        auditService.log("CREATE", "Patient", 10L, "admin@mail.com", "Created patient");

        AuditLog saved = logCaptor.getValue();
        assertThat(saved.getAction()).isEqualTo("CREATE");
        assertThat(saved.getEntite()).isEqualTo("Patient");
        assertThat(saved.getTimestamp()).isNotNull();
    }

    @Test
    @DisplayName("should return all audit logs when repository has entries")
    void shouldReturnAllAuditLogsWhenRepositoryHasEntries() {
        PageRequest pageable = PageRequest.of(0, 10);
        AuditLog log = AuditLog.builder().id(1L).action("READ").build();
        when(auditLogRepository.findAll(pageable)).thenReturn(new PageImpl<>(List.of(log), pageable, 1));

        var result = auditService.findAll(pageable);

        assertThat(result.getContent()).containsExactly(log);
    }

    @Test
    @DisplayName("should return audit logs by period when dates are provided")
    void shouldReturnAuditLogsByPeriodWhenDatesAreProvided() {
        LocalDateTime start = LocalDateTime.of(2026, 5, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(2026, 5, 31, 23, 59);
        PageRequest pageable = PageRequest.of(0, 10);
        AuditLog log = AuditLog.builder().id(2L).action("UPDATE").build();
        when(auditLogRepository.findByTimestampBetween(start, end, pageable))
            .thenReturn(new PageImpl<>(List.of(log), pageable, 1));

        var result = auditService.findByPeriode(start, end, pageable);

        assertThat(result.getContent()).containsExactly(log);
    }

    @Test
    @DisplayName("should create emitter when subscribing to audit stream")
    void shouldCreateEmitterWhenSubscribingToAuditStream() {
        SseEmitter emitter = auditService.subscribe();

        assertThat(emitter).isNotNull();
        auditService.log("CREATE", "Patient", 10L, "admin@mail.com", "Created patient");
        verify(auditLogRepository).save(org.mockito.ArgumentMatchers.any(AuditLog.class));
    }
}
