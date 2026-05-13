package com.cabinet.medical.service;

import com.cabinet.medical.dto.request.MutuelleRequest;
import com.cabinet.medical.dto.response.MutuelleResponse;
import com.cabinet.medical.entity.Mutuelle;
import com.cabinet.medical.entity.Patient;
import com.cabinet.medical.enums.TypeMutuelle;
import com.cabinet.medical.exception.ResourceNotFoundException;
import com.cabinet.medical.mapper.MutuelleMapper;
import com.cabinet.medical.repository.MutuelleRepository;
import com.cabinet.medical.repository.PatientRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("MutuelleService")
class MutuelleServiceTest {

    @Mock
    private MutuelleRepository mutuelleRepository;
    @Mock
    private PatientRepository patientRepository;
    @Mock
    private MutuelleMapper mutuelleMapper;

    @InjectMocks
    private MutuelleService mutuelleService;

    @Test
    @DisplayName("should return all insurance records when repository has data")
    void shouldReturnAllInsuranceRecordsWhenRepositoryHasData() {
        Mutuelle mutuelle = mutuelle(1L, patient(1L));
        MutuelleResponse expected = response(1L);
        PageRequest pageable = PageRequest.of(0, 10);

        when(mutuelleRepository.findAll(pageable)).thenReturn(new PageImpl<>(List.of(mutuelle), pageable, 1));
        when(mutuelleMapper.toResponse(mutuelle)).thenReturn(expected);

        var result = mutuelleService.getAll(pageable);

        assertThat(result.getContent()).containsExactly(expected);
    }

    @Test
    @DisplayName("should return insurance by id when it exists")
    void shouldReturnInsuranceByIdWhenItExists() {
        Mutuelle mutuelle = mutuelle(2L, patient(1L));
        MutuelleResponse expected = response(2L);

        when(mutuelleRepository.findById(2L)).thenReturn(Optional.of(mutuelle));
        when(mutuelleMapper.toResponse(mutuelle)).thenReturn(expected);

        MutuelleResponse actual = mutuelleService.getById(2L);

        assertThat(actual.getId()).isEqualTo(2L);
    }

    @Test
    @DisplayName("should return insurance by patient when it exists")
    void shouldReturnInsuranceByPatientWhenItExists() {
        Mutuelle mutuelle = mutuelle(3L, patient(7L));
        MutuelleResponse expected = response(3L);
        expected.setPatientId(7L);

        when(mutuelleRepository.findByPatientId(7L)).thenReturn(Optional.of(mutuelle));
        when(mutuelleMapper.toResponse(mutuelle)).thenReturn(expected);

        MutuelleResponse actual = mutuelleService.getByPatient(7L);

        assertThat(actual.getPatientId()).isEqualTo(7L);
    }

    @Test
    @DisplayName("should create insurance when patient exists")
    void shouldCreateInsuranceWhenPatientExists() {
        Patient patient = patient(1L);
        MutuelleRequest request = request();
        Mutuelle saved = mutuelle(4L, patient);
        MutuelleResponse expected = response(4L);

        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(mutuelleRepository.save(any(Mutuelle.class))).thenReturn(saved);
        when(mutuelleMapper.toResponse(saved)).thenReturn(expected);

        MutuelleResponse actual = mutuelleService.create(request);

        assertThat(actual.getId()).isEqualTo(4L);
        verify(mutuelleRepository).save(any(Mutuelle.class));
    }

    @Test
    @DisplayName("should update insurance when insurance exists")
    void shouldUpdateInsuranceWhenInsuranceExists() {
        Mutuelle mutuelle = mutuelle(5L, patient(1L));
        MutuelleRequest request = request();
        request.setOrganismeNom("Updated Insurance");
        MutuelleResponse expected = response(5L);
        expected.setOrganismeNom("Updated Insurance");

        when(mutuelleRepository.findById(5L)).thenReturn(Optional.of(mutuelle));
        when(mutuelleRepository.save(mutuelle)).thenReturn(mutuelle);
        when(mutuelleMapper.toResponse(mutuelle)).thenReturn(expected);

        MutuelleResponse actual = mutuelleService.update(5L, request);

        assertThat(actual.getOrganismeNom()).isEqualTo("Updated Insurance");
        assertThat(mutuelle.getOrganismeNom()).isEqualTo("Updated Insurance");
    }

    @Test
    @DisplayName("should throw not found when patient is missing during create")
    void shouldThrowNotFoundWhenPatientIsMissingDuringCreate() {
        MutuelleRequest request = request();
        when(patientRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> mutuelleService.create(request))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("Patient");
    }

    private MutuelleRequest request() {
        MutuelleRequest request = new MutuelleRequest();
        request.setType(TypeMutuelle.CNSS);
        request.setNumeroAffiliation("AFF-123");
        request.setOrganismeNom("CNSS");
        request.setDateAffiliation(LocalDate.of(2024, 1, 15));
        request.setImmatriculation(123456789L);
        request.setSomEtabPens(11L);
        request.setPatientId(1L);
        return request;
    }

    private Patient patient(Long id) {
        return Patient.builder()
            .id(id)
            .nom("Doe")
            .prenom("Jane")
            .cin("CIN-" + id)
            .build();
    }

    private Mutuelle mutuelle(Long id, Patient patient) {
        return Mutuelle.builder()
            .id(id)
            .type(TypeMutuelle.CNSS)
            .numeroAffiliation("AFF-123")
            .organismeNom("CNSS")
            .dateAffiliation(LocalDate.of(2024, 1, 15))
            .immatriculation(123456789L)
            .somEtabPens(11L)
            .patient(patient)
            .build();
    }

    private MutuelleResponse response(Long id) {
        MutuelleResponse response = new MutuelleResponse();
        response.setId(id);
        response.setType(TypeMutuelle.CNSS);
        response.setNumeroAffiliation("AFF-123");
        response.setOrganismeNom("CNSS");
        response.setDateAffiliation(LocalDate.of(2024, 1, 15));
        response.setImmatriculation(123456789L);
        response.setSomEtabPens(11L);
        response.setPatientId(1L);
        response.setPatientNom("Doe");
        response.setPatientPrenom("Jane");
        return response;
    }
}
