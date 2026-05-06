package com.cabinet.medical.service;

import com.cabinet.medical.entity.AuditLog;
import com.cabinet.medical.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    // Thread-safe list of active SSE connections
    private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public void log(String action, String entite, Long entiteId, String utilisateur, String details) {
        AuditLog entry = AuditLog.builder()
            .action(action)
            .entite(entite)
            .entiteId(entiteId)
            .utilisateur(utilisateur)
            .timestamp(LocalDateTime.now())
            .details(details)
            .build();
        AuditLog saved = auditLogRepository.save(entry);
        broadcast(saved);
    }

    public Page<AuditLog> findAll(Pageable pageable) {
        return auditLogRepository.findAll(pageable);
    }

    public Page<AuditLog> findByPeriode(LocalDateTime debut, LocalDateTime fin, Pageable pageable) {
        return auditLogRepository.findByTimestampBetween(debut, fin, pageable);
    }

    /** Registers a new SSE subscriber and returns the emitter. */
    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(0L); // 0 = no server-side timeout
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(()    -> emitters.remove(emitter));
        emitter.onError(e       -> emitters.remove(emitter));
        // Send an initial heartbeat so the client knows the stream is alive
        try {
            emitter.send(SseEmitter.event().name("connected").data("ok"));
        } catch (IOException e) {
            emitters.remove(emitter);
        }
        return emitter;
    }

    private void broadcast(AuditLog log) {
        List<SseEmitter> dead = new ArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("new_log").data(log));
            } catch (IOException e) {
                dead.add(emitter);
            }
        }
        emitters.removeAll(dead);
    }
}
