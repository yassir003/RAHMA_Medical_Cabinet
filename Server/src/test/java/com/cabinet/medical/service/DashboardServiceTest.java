package com.cabinet.medical.service;

import com.cabinet.medical.enums.StatutDossier;
import com.cabinet.medical.enums.StatutRdv;
import com.cabinet.medical.enums.TypeMutuelle;
import com.cabinet.medical.repository.ConsultationRepository;
import com.cabinet.medical.repository.DossierRemboursementRepository;
import com.cabinet.medical.repository.MedecinRepository;
import com.cabinet.medical.repository.MutuelleRepository;
import com.cabinet.medical.repository.PatientRepository;
import com.cabinet.medical.repository.RendezVousRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("DashboardService")
class DashboardServiceTest {

    @Mock
    private PatientRepository patientRepository;
    @Mock
    private MedecinRepository medecinRepository;
    @Mock
    private RendezVousRepository rendezVousRepository;
    @Mock
    private ConsultationRepository consultationRepository;
    @Mock
    private DossierRemboursementRepository dossierRepository;
    @Mock
    private MutuelleRepository mutuelleRepository;

    @InjectMocks
    private DashboardService dashboardService;

    @Test
    @DisplayName("should return aggregate totals when repositories provide counts")
    void shouldReturnAggregateTotalsWhenRepositoriesProvideCounts() {
        mockDashboardQueries(Page.empty(), new PageImpl<>(List.of(new Object())), new PageImpl<>(List.of(new Object(), new Object())));
        when(patientRepository.count()).thenReturn(10L);
        when(medecinRepository.count()).thenReturn(3L);
        when(rendezVousRepository.count()).thenReturn(12L);
        when(consultationRepository.count()).thenReturn(7L);

        var stats = dashboardService.getStats();

        assertThat(stats.getTotalPatients()).isEqualTo(10);
        assertThat(stats.getTotalMedecins()).isEqualTo(3);
        assertThat(stats.getTotalRendezVous()).isEqualTo(12);
        assertThat(stats.getTotalConsultations()).isEqualTo(7);
    }

    @Test
    @DisplayName("should map insurance counts by type when repository returns grouped rows")
    void shouldMapInsuranceCountsByTypeWhenRepositoryReturnsGroupedRows() {
        mockDashboardQueries(Page.empty(), Page.empty(), Page.empty());
        when(mutuelleRepository.countByType()).thenReturn(List.of(
            new Object[] {TypeMutuelle.CNSS, 4L},
            new Object[] {TypeMutuelle.ASSURANCE_PRIVEE, 2L}
        ));

        var stats = dashboardService.getStats();

        assertThat(stats.getPatientsParMutuelle()).containsEntry("CNSS", 4L);
        assertThat(stats.getPatientsParMutuelle()).containsEntry("ASSURANCE_PRIVEE", 2L);
    }

    @Test
    @DisplayName("should map appointments by month and status when repository returns grouped rows")
    void shouldMapAppointmentsByMonthAndStatusWhenRepositoryReturnsGroupedRows() {
        mockDashboardQueries(Page.empty(), Page.empty(), Page.empty());
        when(rendezVousRepository.countRendezVousParMoisEtStatut()).thenReturn(List.of(
            new Object[] {"2026-05", StatutRdv.PLANIFIE, 6L},
            new Object[] {"2026-05", StatutRdv.ANNULE, 1L},
            new Object[] {"2026-06", StatutRdv.TERMINE, 3L}
        ));

        var stats = dashboardService.getStats();

        assertThat(stats.getRendezVousParMois().get("2026-05")).containsEntry("PLANIFIE", 6L);
        assertThat(stats.getRendezVousParMois().get("2026-05")).containsEntry("ANNULE", 1L);
        assertThat(stats.getRendezVousParMois().get("2026-06")).containsEntry("TERMINE", 3L);
    }

    @Test
    @DisplayName("should include operational counters when repositories return pages")
    void shouldIncludeOperationalCountersWhenRepositoriesReturnPages() {
        mockDashboardQueries(new PageImpl<>(List.of(new Object(), new Object())),
            new PageImpl<>(List.of(new Object(), new Object(), new Object())),
            new PageImpl<>(List.of(new Object())));

        var stats = dashboardService.getStats();

        assertThat(stats.getRdvAujourdhui()).isEqualTo(2);
        assertThat(stats.getRdvPlanifies()).isEqualTo(3);
        assertThat(stats.getDossierEnAttente()).isEqualTo(1);
    }

    @SuppressWarnings({"rawtypes", "unchecked"})
    private void mockDashboardQueries(Page todaysAppointments, Page plannedAppointments, Page waitingDossiers) {
        when(mutuelleRepository.countByType()).thenReturn(List.of());
        when(rendezVousRepository.countRendezVousParMoisEtStatut()).thenReturn(List.of());
        when(rendezVousRepository.findByMedecinIdAndDateHeureBetween(eq(null), any(), any(), any()))
            .thenReturn(todaysAppointments);
        when(rendezVousRepository.findByStatut(eq(StatutRdv.PLANIFIE), any())).thenReturn(plannedAppointments);
        when(dossierRepository.findByStatut(eq(StatutDossier.EN_ATTENTE), any())).thenReturn(waitingDossiers);
    }
}
