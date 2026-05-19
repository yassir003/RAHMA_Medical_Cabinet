package com.cabinet.medical.soap;

import com.cabinet.medical.dto.response.DossierRemboursementResponse;
import com.cabinet.medical.entity.Mutuelle;
import com.cabinet.medical.entity.Patient;
import com.cabinet.medical.enums.TypeMutuelle;
import com.cabinet.medical.exception.ResourceNotFoundException;
import com.cabinet.medical.repository.MutuelleRepository;
import com.cabinet.medical.repository.PatientRepository;
import com.cabinet.medical.service.DossierRemboursementService;
import com.cabinet.medical.support.TestDataFactory;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationContext;
import org.springframework.ws.transport.http.MessageDispatcherServlet;
import org.springframework.xml.xsd.XsdSchema;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("SOAP endpoints")
class SoapEndpointCoverageTest {

    @Mock
    private PatientRepository patientRepository;
    @Mock
    private MutuelleRepository mutuelleRepository;
    @Mock
    private DossierRemboursementService dossierService;
    @Mock
    private ApplicationContext applicationContext;
    @Mock
    private XsdSchema xsdSchema;

    @Test
    @DisplayName("should return patient details when CIN exists")
    void shouldReturnPatientDetailsWhenCinExists() {
        PatientEndpoint endpoint = new PatientEndpoint(patientRepository);
        Patient patient = TestDataFactory.patient(1L);
        PatientEndpoint.GetPatientByCinRequest request = new PatientEndpoint.GetPatientByCinRequest();
        request.setCin("CIN-1");
        when(patientRepository.findByCin("CIN-1")).thenReturn(Optional.of(patient));

        PatientEndpoint.GetPatientByCinResponse response = endpoint.getPatientByCin(request);

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getNom()).isEqualTo("Doe");
        assertThat(response.getPrenom()).isEqualTo("Jane");
        assertThat(response.getTelephone()).isEqualTo("0600000000");
        assertThat(response.getAdresse()).isEqualTo("Casablanca");
    }

    @Test
    @DisplayName("should throw not found when CIN does not exist")
    void shouldThrowNotFoundWhenCinDoesNotExist() {
        PatientEndpoint endpoint = new PatientEndpoint(patientRepository);
        PatientEndpoint.GetPatientByCinRequest request = new PatientEndpoint.GetPatientByCinRequest();
        request.setCin("UNKNOWN");
        when(patientRepository.findByCin("UNKNOWN")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> endpoint.getPatientByCin(request))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("Patient non trouv");
    }

    @Test
    @DisplayName("should create patient and return success response when request is valid")
    void shouldCreatePatientAndReturnSuccessResponseWhenRequestIsValid() {
        PatientEndpoint endpoint = new PatientEndpoint(patientRepository);
        PatientEndpoint.CreatePatientRequest request = new PatientEndpoint.CreatePatientRequest();
        request.setNom("Brown");
        request.setPrenom("Charlie");
        request.setCin("CB-123");
        request.setTelephone("0612345678");
        request.setAdresse("Rabat");
        Patient saved = Patient.builder().id(2L).nom("Brown").prenom("Charlie").cin("CB-123").build();
        ArgumentCaptor<Patient> captor = ArgumentCaptor.forClass(Patient.class);
        when(patientRepository.save(any(Patient.class))).thenReturn(saved);

        PatientEndpoint.CreatePatientResponse response = endpoint.createPatient(request);

        verify(patientRepository).save(captor.capture());
        assertThat(captor.getValue().getCin()).isEqualTo("CB-123");
        assertThat(response.getId()).isEqualTo(2L);
        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).contains("Patient");
    }

    @Test
    @DisplayName("should return covered insurance information when patient has mutuelle")
    void shouldReturnCoveredInsuranceInformationWhenPatientHasMutuelle() {
        MutuelleEndpoint endpoint = new MutuelleEndpoint(mutuelleRepository, dossierService);
        Mutuelle mutuelle = Mutuelle.builder()
            .id(3L)
            .type(TypeMutuelle.CNSS)
            .dateAffiliation(LocalDate.of(2024, 1, 15))
            .immatriculation(123456789L)
            .somEtabPens(44L)
            .build();
        MutuelleEndpoint.VerifierCouvertureRequest request = new MutuelleEndpoint.VerifierCouvertureRequest();
        request.setPatientId(10L);
        when(mutuelleRepository.findByPatientId(10L)).thenReturn(Optional.of(mutuelle));

        MutuelleEndpoint.VerifierCouvertureResponse response = endpoint.verifierCouverture(request);

        assertThat(response.isCouvert()).isTrue();
        assertThat(response.getTypeMutuelle()).isEqualTo("CNSS");
        assertThat(response.getDateAffiliation()).isEqualTo("2024-01-15");
        assertThat(response.getImmatriculation()).isEqualTo(123456789L);
        assertThat(response.getSomEtabPens()).isEqualTo(44L);
    }

    @Test
    @DisplayName("should return uncovered response when patient has no mutuelle")
    void shouldReturnUncoveredResponseWhenPatientHasNoMutuelle() {
        MutuelleEndpoint endpoint = new MutuelleEndpoint(mutuelleRepository, dossierService);
        MutuelleEndpoint.VerifierCouvertureRequest request = new MutuelleEndpoint.VerifierCouvertureRequest();
        request.setPatientId(11L);
        when(mutuelleRepository.findByPatientId(11L)).thenReturn(Optional.empty());

        MutuelleEndpoint.VerifierCouvertureResponse response = endpoint.verifierCouverture(request);

        assertThat(response.isCouvert()).isFalse();
        assertThat(response.getTypeMutuelle()).isNull();
    }

    @Test
    @DisplayName("should create reimbursement dossier when service succeeds")
    void shouldCreateReimbursementDossierWhenServiceSucceeds() {
        MutuelleEndpoint endpoint = new MutuelleEndpoint(mutuelleRepository, dossierService);
        MutuelleEndpoint.DemandeRemboursementSoapRequest request = new MutuelleEndpoint.DemandeRemboursementSoapRequest();
        request.setPatientId(12L);
        request.setConsultationId(13L);
        request.setMutuelleId(14L);
        DossierRemboursementResponse dossier = new DossierRemboursementResponse();
        dossier.setId(15L);
        when(dossierService.createDossier(any())).thenReturn(dossier);

        MutuelleEndpoint.DemandeRemboursementResponse response = endpoint.demandeRemboursement(request);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getDossierId()).isEqualTo(15L);
        assertThat(response.getMessage()).contains("Dossier");
    }

    @Test
    @DisplayName("should return failure reimbursement response when service throws exception")
    void shouldReturnFailureReimbursementResponseWhenServiceThrowsException() {
        MutuelleEndpoint endpoint = new MutuelleEndpoint(mutuelleRepository, dossierService);
        MutuelleEndpoint.DemandeRemboursementSoapRequest request = new MutuelleEndpoint.DemandeRemboursementSoapRequest();
        request.setPatientId(16L);
        request.setConsultationId(17L);
        request.setMutuelleId(18L);
        when(dossierService.createDossier(any())).thenThrow(new IllegalStateException("Mutuelle expiree"));

        MutuelleEndpoint.DemandeRemboursementResponse response = endpoint.demandeRemboursement(request);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getDossierId()).isNull();
        assertThat(response.getMessage()).isEqualTo("Mutuelle expiree");
    }

    @Test
    @DisplayName("should configure SOAP servlet registration with ws mapping")
    void shouldConfigureSoapServletRegistrationWithWsMapping() {
        WebServiceConfig config = new WebServiceConfig();

        var registration = config.messageDispatcherServlet(applicationContext);

        assertThat(registration.getUrlMappings()).containsExactly("/ws/*");
        assertThat(registration.getServlet()).isInstanceOf(MessageDispatcherServlet.class);
    }

    @Test
    @DisplayName("should create wsdl definition when schema is provided")
    void shouldCreateWsdlDefinitionWhenSchemaIsProvided() {
        WebServiceConfig config = new WebServiceConfig();

        var definition = config.defaultWsdl11Definition(xsdSchema);

        assertThat(definition).isNotNull();
    }

    @Test
    @DisplayName("should create cabinet schema from classpath resource")
    void shouldCreateCabinetSchemaFromClasspathResource() {
        WebServiceConfig config = new WebServiceConfig();

        XsdSchema schema = config.cabinetSchema();

        assertThat(schema).isNotNull();
    }
}
