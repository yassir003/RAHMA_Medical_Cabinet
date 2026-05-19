package com.cabinet.medical.controller;

import com.cabinet.medical.dto.request.DossierRemboursementRequest;
import com.cabinet.medical.dto.request.MedecinRequest;
import com.cabinet.medical.dto.request.MutuelleRequest;
import com.cabinet.medical.dto.request.SecretaireRequest;
import com.cabinet.medical.dto.response.DashboardStatsResponse;
import com.cabinet.medical.dto.response.DossierRemboursementResponse;
import com.cabinet.medical.dto.response.MedecinResponse;
import com.cabinet.medical.dto.response.MutuelleResponse;
import com.cabinet.medical.dto.response.SecretaireResponse;
import com.cabinet.medical.entity.AuditLog;
import com.cabinet.medical.entity.Notification;
import com.cabinet.medical.enums.StatutDossier;
import com.cabinet.medical.enums.TypeMutuelle;
import com.cabinet.medical.service.AuditService;
import com.cabinet.medical.service.DashboardService;
import com.cabinet.medical.service.DossierRemboursementService;
import com.cabinet.medical.service.MedecinService;
import com.cabinet.medical.service.MutuelleService;
import com.cabinet.medical.service.NotificationService;
import com.cabinet.medical.service.SecretaireService;
import com.cabinet.medical.support.TestDataFactory;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Additional REST controllers")
class AdditionalControllerCoverageTest {

    @Mock
    private MedecinService medecinService;
    @Mock
    private SecretaireService secretaireService;
    @Mock
    private MutuelleService mutuelleService;
    @Mock
    private DossierRemboursementService dossierService;
    @Mock
    private DashboardService dashboardService;
    @Mock
    private AuditService auditService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private Authentication authentication;

    @Test
    @DisplayName("should return doctors and doctor profile when medecin controller is called")
    void shouldReturnDoctorsAndDoctorProfileWhenMedecinControllerIsCalled() {
        MedecinController controller = new MedecinController(medecinService);
        MedecinResponse doctor = TestDataFactory.medecinResponse(1L);
        when(medecinService.getAll(eq("house"), any(Pageable.class))).thenReturn(new PageImpl<>(List.of(doctor)));
        when(authentication.getName()).thenReturn("doctor@mail.com");
        when(medecinService.getMe("doctor@mail.com")).thenReturn(doctor);

        var listResponse = controller.getAll(0, 10, "nom", "desc", "house");
        var meResponse = controller.getMe(authentication);

        assertThat(listResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(listResponse.getBody().getData().getContent()).containsExactly(doctor);
        assertThat(meResponse.getBody().getData().getEmail()).isEqualTo("doctor@mail.com");
    }

    @Test
    @DisplayName("should create update and delete doctor when medecin controller receives admin operations")
    void shouldCreateUpdateAndDeleteDoctorWhenMedecinControllerReceivesAdminOperations() {
        MedecinController controller = new MedecinController(medecinService);
        MedecinRequest request = medecinRequest();
        MedecinResponse doctor = TestDataFactory.medecinResponse(2L);
        when(medecinService.create(request)).thenReturn(doctor);
        when(medecinService.update(2L, request)).thenReturn(doctor);

        var createResponse = controller.create(request);
        var updateResponse = controller.update(2L, request);
        var deleteResponse = controller.delete(2L);

        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(updateResponse.getBody().getData().getId()).isEqualTo(2L);
        assertThat(deleteResponse.getBody().getStatus()).isEqualTo(200);
        verify(medecinService).delete(2L);
    }

    @Test
    @DisplayName("should return and mutate secretaries when secretaire controller is called")
    void shouldReturnAndMutateSecretariesWhenSecretaireControllerIsCalled() {
        SecretaireController controller = new SecretaireController(secretaireService);
        SecretaireRequest request = secretaireRequest();
        SecretaireResponse secretary = SecretaireResponse.builder()
            .id(3L)
            .nom("Smith")
            .prenom("Anna")
            .telephone("0600001111")
            .email("secretary@mail.com")
            .build();
        when(secretaireService.getAll(eq("anna"), any(Pageable.class))).thenReturn(new PageImpl<>(List.of(secretary)));
        when(secretaireService.getById(3L)).thenReturn(secretary);
        when(secretaireService.create(request)).thenReturn(secretary);
        when(secretaireService.update(3L, request)).thenReturn(secretary);

        var listResponse = controller.getAll(0, 5, "prenom", "asc", "anna");
        var byIdResponse = controller.getById(3L);
        var createResponse = controller.create(request);
        var updateResponse = controller.update(3L, request);
        var deleteResponse = controller.delete(3L);

        assertThat(listResponse.getBody().getData().getContent()).containsExactly(secretary);
        assertThat(byIdResponse.getBody().getData().getEmail()).isEqualTo("secretary@mail.com");
        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(updateResponse.getBody().getData().getId()).isEqualTo(3L);
        assertThat(deleteResponse.getBody().getStatus()).isEqualTo(200);
        verify(secretaireService).delete(3L);
    }

    @Test
    @DisplayName("should return insurance endpoints when mutuelle controller is called")
    void shouldReturnInsuranceEndpointsWhenMutuelleControllerIsCalled() {
        MutuelleController controller = new MutuelleController(mutuelleService);
        MutuelleRequest request = mutuelleRequest();
        MutuelleResponse response = mutuelleResponse(4L);
        when(mutuelleService.getAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(response)));
        when(mutuelleService.getById(4L)).thenReturn(response);
        when(mutuelleService.getByPatient(5L)).thenReturn(response);
        when(mutuelleService.create(request)).thenReturn(response);
        when(mutuelleService.update(4L, request)).thenReturn(response);

        var allResponse = controller.getAll(0, 10);
        var byIdResponse = controller.getById(4L);
        var patientResponse = controller.getByPatient(5L);
        var createResponse = controller.create(request);
        var updateResponse = controller.update(4L, request);

        assertThat(allResponse.getBody().getData().getContent()).containsExactly(response);
        assertThat(byIdResponse.getBody().getData().getId()).isEqualTo(4L);
        assertThat(patientResponse.getBody().getData().getPatientId()).isEqualTo(5L);
        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(updateResponse.getBody().getData().getOrganismeNom()).isEqualTo("CNSS");
    }

    @Test
    @DisplayName("should route dossier list by status when status parameter is provided")
    void shouldRouteDossierListByStatusWhenStatusParameterIsProvided() {
        DossierRemboursementController controller = new DossierRemboursementController(dossierService);
        DossierRemboursementResponse dossier = dossierResponse(6L);
        when(dossierService.getByStatut(eq(StatutDossier.EN_ATTENTE), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(dossier)));
        when(dossierService.getAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(dossier)));

        var filteredResponse = controller.getAll(0, 10, StatutDossier.EN_ATTENTE);
        var allResponse = controller.getAll(0, 10, null);

        assertThat(filteredResponse.getBody().getData().getContent()).containsExactly(dossier);
        assertThat(allResponse.getBody().getData().getContent()).containsExactly(dossier);
    }

    @Test
    @DisplayName("should create update and fetch dossiers when dossier controller is called")
    void shouldCreateUpdateAndFetchDossiersWhenDossierControllerIsCalled() {
        DossierRemboursementController controller = new DossierRemboursementController(dossierService);
        DossierRemboursementRequest request = dossierRequest();
        DossierRemboursementResponse dossier = dossierResponse(7L);
        when(dossierService.getById(7L)).thenReturn(dossier);
        when(dossierService.createDossier(request)).thenReturn(dossier);
        when(dossierService.changerStatut(7L, StatutDossier.ENVOYE)).thenReturn(dossier);
        when(dossierService.getByPatient(eq(8L), any(Pageable.class))).thenReturn(new PageImpl<>(List.of(dossier)));

        var byIdResponse = controller.getById(7L);
        var createResponse = controller.create(request);
        var statusResponse = controller.changerStatut(7L, StatutDossier.ENVOYE);
        var patientResponse = controller.getByPatient(8L, 0, 10);

        assertThat(byIdResponse.getBody().getData().getId()).isEqualTo(7L);
        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(statusResponse.getBody().getData().getStatut()).isEqualTo(StatutDossier.EN_ATTENTE);
        assertThat(patientResponse.getBody().getData().getContent()).containsExactly(dossier);
    }

    @Test
    @DisplayName("should return dashboard stats when dashboard controller is called")
    void shouldReturnDashboardStatsWhenDashboardControllerIsCalled() {
        DashboardController controller = new DashboardController(dashboardService);
        DashboardStatsResponse stats = DashboardStatsResponse.builder()
            .totalPatients(10)
            .totalMedecins(2)
            .consultationsParMedecin(Map.of("House", 3L))
            .build();
        when(dashboardService.getStats()).thenReturn(stats);

        var response = controller.getStats();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getData().getTotalPatients()).isEqualTo(10);
        assertThat(response.getBody().getData().getConsultationsParMedecin()).containsEntry("House", 3L);
    }

    @Test
    @DisplayName("should return audit page and stream when audit controller is called")
    void shouldReturnAuditPageAndStreamWhenAuditControllerIsCalled() {
        AuditController controller = new AuditController(auditService);
        AuditLog log = AuditLog.builder()
            .id(9L)
            .action("CREATE")
            .entite("Patient")
            .timestamp(LocalDateTime.of(2026, 5, 1, 9, 0))
            .build();
        SseEmitter emitter = new SseEmitter();
        when(auditService.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(log)));
        when(auditService.subscribe()).thenReturn(emitter);

        var pageResponse = controller.getAll(0, 50);
        var streamResponse = controller.stream();

        assertThat(pageResponse.getBody().getData().getContent()).containsExactly(log);
        assertThat(streamResponse.getBody()).isSameAs(emitter);
        assertThat(streamResponse.getHeaders().getFirst("Cache-Control")).isEqualTo("no-cache");
    }

    @Test
    @DisplayName("should return and mutate patient notifications when notification controller is called")
    void shouldReturnAndMutatePatientNotificationsWhenNotificationControllerIsCalled() {
        NotificationController controller = new NotificationController(notificationService);
        Notification notification = TestDataFactory.notification(10L, TestDataFactory.patient(11L));
        when(authentication.getName()).thenReturn("patient@mail.com");
        when(notificationService.getMyNotifications(eq("patient@mail.com"), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(notification)));
        when(notificationService.countUnread("patient@mail.com")).thenReturn(2L);
        when(notificationService.markRead(10L, "patient@mail.com")).thenReturn(notification);

        var listResponse = controller.getMyNotifications(authentication, 0, 20);
        var countResponse = controller.countUnread(authentication);
        var markOneResponse = controller.markRead(10L, authentication);
        var markAllResponse = controller.markAllRead(authentication);

        assertThat(listResponse.getBody().getData().getContent()).containsExactly(notification);
        assertThat(countResponse.getBody().getData()).containsEntry("count", 2L);
        assertThat(markOneResponse.getBody().getData().getId()).isEqualTo(10L);
        assertThat(markAllResponse.getBody().getStatus()).isEqualTo(200);
        verify(notificationService).markAllRead("patient@mail.com");
    }

    private MedecinRequest medecinRequest() {
        MedecinRequest request = new MedecinRequest();
        request.setNom("House");
        request.setPrenom("Gregory");
        request.setSpecialite("Cardiology");
        request.setTelephone("0700000000");
        request.setEmail("doctor@mail.com");
        request.setPassword("Password123");
        return request;
    }

    private SecretaireRequest secretaireRequest() {
        SecretaireRequest request = new SecretaireRequest();
        request.setNom("Smith");
        request.setPrenom("Anna");
        request.setTelephone("0600001111");
        request.setEmail("secretary@mail.com");
        request.setPassword("Password123");
        return request;
    }

    private MutuelleRequest mutuelleRequest() {
        MutuelleRequest request = new MutuelleRequest();
        request.setType(TypeMutuelle.CNSS);
        request.setNumeroAffiliation("AFF-1");
        request.setOrganismeNom("CNSS");
        request.setDateAffiliation(LocalDate.of(2024, 1, 15));
        request.setImmatriculation(123456789L);
        request.setSomEtabPens(33L);
        request.setPatientId(5L);
        return request;
    }

    private MutuelleResponse mutuelleResponse(Long id) {
        MutuelleResponse response = new MutuelleResponse();
        response.setId(id);
        response.setType(TypeMutuelle.CNSS);
        response.setOrganismeNom("CNSS");
        response.setPatientId(5L);
        response.setPatientNom("Doe");
        response.setPatientPrenom("Jane");
        return response;
    }

    private DossierRemboursementRequest dossierRequest() {
        DossierRemboursementRequest request = new DossierRemboursementRequest();
        request.setPatientId(8L);
        request.setConsultationId(9L);
        request.setMutuelleId(10L);
        request.setDocumentJustificatif("invoice.pdf");
        return request;
    }

    private DossierRemboursementResponse dossierResponse(Long id) {
        DossierRemboursementResponse response = new DossierRemboursementResponse();
        response.setId(id);
        response.setStatut(StatutDossier.EN_ATTENTE);
        response.setPatientId(8L);
        response.setConsultationId(9L);
        response.setMutuelleId(10L);
        return response;
    }
}
