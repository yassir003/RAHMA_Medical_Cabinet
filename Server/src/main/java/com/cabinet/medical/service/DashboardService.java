package com.cabinet.medical.service;

import com.cabinet.medical.dto.response.DashboardStatsResponse;
import com.cabinet.medical.enums.StatutDossier;
import com.cabinet.medical.enums.StatutRdv;
import com.cabinet.medical.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final RendezVousRepository rendezVousRepository;
    private final ConsultationRepository consultationRepository;
    private final DossierRemboursementRepository dossierRepository;
    private final MutuelleRepository mutuelleRepository;

    public DashboardStatsResponse getStats() {
        LocalDateTime debutJour = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime finJour = debutJour.plusDays(1);

        Map<String, Long> patientsParMutuelle = new HashMap<>();
        mutuelleRepository.countByType().forEach(row ->
            patientsParMutuelle.put(row[0].toString(), (Long) row[1]));

        return DashboardStatsResponse.builder()
            .totalPatients(patientRepository.count())
            .totalMedecins(medecinRepository.count())
            .totalRendezVous(rendezVousRepository.count())
            .totalConsultations(consultationRepository.count())
            .rdvAujourdhui(rendezVousRepository.findByMedecinIdAndDateHeureBetween(
                null, debutJour, finJour, org.springframework.data.domain.Pageable.unpaged()).getTotalElements())
            .rdvPlanifies(rendezVousRepository.findByStatut(
                StatutRdv.PLANIFIE, org.springframework.data.domain.Pageable.unpaged()).getTotalElements())
            .dossierEnAttente(dossierRepository.findByStatut(
                StatutDossier.EN_ATTENTE, org.springframework.data.domain.Pageable.unpaged()).getTotalElements())
            .patientsParMutuelle(patientsParMutuelle)
            .build();
    }
}
