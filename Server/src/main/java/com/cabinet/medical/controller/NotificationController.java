package com.cabinet.medical.controller;

import com.cabinet.medical.dto.response.ApiResponse;
import com.cabinet.medical.entity.Notification;
import com.cabinet.medical.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /** Paginated list of notifications for the authenticated patient, newest first. */
    @GetMapping("/me")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<Page<Notification>>> getMyNotifications(
            Authentication auth,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pr = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "dateCreation"));
        return ResponseEntity.ok(ApiResponse.success(
            notificationService.getMyNotifications(auth.getName(), pr),
            "Notifications récupérées", 200));
    }

    /** Number of unread notifications for the authenticated patient. */
    @GetMapping("/me/count-non-lus")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> countUnread(Authentication auth) {
        long count = notificationService.countUnread(auth.getName());
        return ResponseEntity.ok(ApiResponse.success(
            Map.of("count", count), "Comptage effectué", 200));
    }

    /** Mark a single notification as read (ownership enforced in service). */
    @PatchMapping("/{id}/lu")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<Notification>> markRead(
            @PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
            notificationService.markRead(id, auth.getName()),
            "Notification marquée comme lue", 200));
    }

    /** Mark all the authenticated patient's notifications as read. */
    @PatchMapping("/lu-tout")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<Void>> markAllRead(Authentication auth) {
        notificationService.markAllRead(auth.getName());
        return ResponseEntity.ok(ApiResponse.success(null, "Toutes les notifications marquées comme lues", 200));
    }
}
