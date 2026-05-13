package com.cabinet.medical.service.rmi;

import com.cabinet.medical.dto.response.DashboardStatsResponse;
import com.cabinet.medical.dto.response.PatientResponse;
import com.cabinet.medical.entity.Patient;
import com.cabinet.medical.mapper.PatientMapper;
import com.cabinet.medical.repository.PatientRepository;
import com.cabinet.medical.service.DashboardService;
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
@DisplayName("PatientRemoteServiceImpl")
class PatientRemoteServiceImplTest {

    @Mock
    private PatientRepository patientRepository;
    @Mock
    private PatientMapper patientMapper;
    @Mock
    private DashboardService dashboardService;

    @InjectMocks
    private PatientRemoteServiceImpl patientRemoteService;

    @Test
    @DisplayName("should return patient by id when patient exists")
    void shouldReturnPatientByIdWhenPatientExists() throws Exception {
        Patient patient = patient(1L);
        PatientResponse expected = response(1L);
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(patientMapper.toResponse(patient)).thenReturn(expected);

        PatientResponse actual = patientRemoteService.getPatientById(1L);

        assertThat(actual).isEqualTo(expected);
    }

    @Test
    @DisplayName("should throw remote exception when patient is missing")
    void shouldThrowRemoteExceptionWhenPatientIsMissing() {
        when(patientRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> patientRemoteService.getPatientById(99L))
            .isInstanceOf(RemoteException.class)
            .hasMessageContaining("99");
    }

    @Test
    @DisplayName("should search patients when query is provided")
    void shouldSearchPatientsWhenQueryIsProvided() throws Exception {
        Patient patient = patient(2L);
        PatientResponse expected = response(2L);
        PageRequest expectedPage = PageRequest.of(0, 20);
        when(patientRepository.findByNomContainingOrPrenomContainingOrCinContaining("doe", "doe", "doe", expectedPage))
            .thenReturn(new PageImpl<>(List.of(patient), expectedPage, 1));
        when(patientMapper.toResponse(patient)).thenReturn(expected);

        List<PatientResponse> results = patientRemoteService.searchPatients("doe");

        assertThat(results).containsExactly(expected);
    }

    @Test
    @DisplayName("should return statistics from dashboard service")
    void shouldReturnStatisticsFromDashboardService() throws Exception {
        DashboardStatsResponse expected = DashboardStatsResponse.builder().totalPatients(5).build();
        when(dashboardService.getStats()).thenReturn(expected);

        DashboardStatsResponse actual = patientRemoteService.getStatistiques();

        assertThat(actual.getTotalPatients()).isEqualTo(5);
    }

    private Patient patient(Long id) {
        return Patient.builder()
            .id(id)
            .nom("Doe")
            .prenom("Jane")
            .cin("CIN-" + id)
            .telephone("0600000000")
            .build();
    }

    private PatientResponse response(Long id) {
        PatientResponse response = new PatientResponse();
        response.setId(id);
        response.setNom("Doe");
        response.setPrenom("Jane");
        response.setCin("CIN-" + id);
        response.setTelephone("0600000000");
        return response;
    }
}
