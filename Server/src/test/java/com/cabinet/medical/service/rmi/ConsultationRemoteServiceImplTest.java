package com.cabinet.medical.service.rmi;

import com.cabinet.medical.dto.response.ConsultationResponse;
import com.cabinet.medical.entity.Consultation;
import com.cabinet.medical.entity.Medecin;
import com.cabinet.medical.entity.Patient;
import com.cabinet.medical.mapper.ConsultationMapper;
import com.cabinet.medical.repository.ConsultationRepository;
import com.cabinet.medical.repository.MedecinRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.rmi.RemoteException;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ConsultationRemoteServiceImpl")
class ConsultationRemoteServiceImplTest {

    @Mock
    private ConsultationRepository consultationRepository;
    @Mock
    private ConsultationMapper consultationMapper;
    @Mock
    private MedecinRepository medecinRepository;

    @InjectMocks
    private ConsultationRemoteServiceImpl consultationRemoteService;

    @Test
    @DisplayName("should return consultation history when patient has consultations")
    void shouldReturnConsultationHistoryWhenPatientHasConsultations() throws Exception {
        Consultation consultation = consultation(1L);
        ConsultationResponse expected = response(1L);
        PageRequest expectedPage = PageRequest.of(0, 50);
        when(consultationRepository.findByPatientId(1L, expectedPage))
            .thenReturn(new PageImpl<>(List.of(consultation), expectedPage, 1));
        when(consultationMapper.toResponse(consultation)).thenReturn(expected);

        List<ConsultationResponse> history = consultationRemoteService.getHistorique(1L);

        assertThat(history).containsExactly(expected);
    }

    @Test
    @DisplayName("should return consultation by id when consultation exists")
    void shouldReturnConsultationByIdWhenConsultationExists() throws Exception {
        Consultation consultation = consultation(2L);
        ConsultationResponse expected = response(2L);
        when(consultationRepository.findById(2L)).thenReturn(Optional.of(consultation));
        when(consultationMapper.toResponse(consultation)).thenReturn(expected);

        ConsultationResponse actual = consultationRemoteService.getConsultationById(2L);

        assertThat(actual).isEqualTo(expected);
    }

    @Test
    @DisplayName("should throw remote exception when consultation is missing")
    void shouldThrowRemoteExceptionWhenConsultationIsMissing() {
        when(consultationRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> consultationRemoteService.getConsultationById(99L))
            .isInstanceOf(RemoteException.class)
            .hasMessageContaining("99");
    }

    @Test
    @DisplayName("should return consultation counts by doctor when doctors exist")
    void shouldReturnConsultationCountsByDoctorWhenDoctorsExist() throws Exception {
        Medecin medecin = medecin(3L);
        when(medecinRepository.findAll()).thenReturn(List.of(medecin));
        when(consultationRepository.countByMedecinId(3L)).thenReturn(8L);

        var stats = consultationRemoteService.getStatsParMedecin();

        assertThat(stats).containsEntry("House Gregory", 8L);
    }

    private Consultation consultation(Long id) {
        Patient patient = Patient.builder()
            .id(1L)
            .nom("Doe")
            .prenom("Jane")
            .cin("CIN-1")
            .build();
        return Consultation.builder()
            .id(id)
            .patient(patient)
            .medecin(medecin(2L))
            .motif("Controle")
            .build();
    }

    private Medecin medecin(Long id) {
        return Medecin.builder()
            .id(id)
            .nom("House")
            .prenom("Gregory")
            .specialite("Cardiology")
            .build();
    }

    private ConsultationResponse response(Long id) {
        ConsultationResponse response = new ConsultationResponse();
        response.setId(id);
        response.setPatientId(1L);
        response.setPatientNom("Doe");
        response.setPatientPrenom("Jane");
        response.setMedecinId(2L);
        response.setMedecinNom("House");
        response.setMedecinPrenom("Gregory");
        response.setMotif("Controle");
        return response;
    }
}
