package com.cabinet.medical.service.rmi;

import com.cabinet.medical.dto.response.DashboardStatsResponse;
import com.cabinet.medical.dto.response.PatientResponse;
import com.cabinet.medical.mapper.PatientMapper;
import com.cabinet.medical.repository.PatientRepository;
import com.cabinet.medical.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.rmi.RemoteException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PatientRemoteServiceImpl implements IPatientRemoteService {

    private final PatientRepository patientRepository;
    private final PatientMapper patientMapper;
    private final DashboardService dashboardService;

    @Override
    public PatientResponse getPatientById(Long id) throws RemoteException {
        return patientRepository.findById(id)
            .map(patientMapper::toResponse)
            .orElseThrow(() -> new RemoteException("Patient non trouvé: " + id));
    }

    @Override
    public List<PatientResponse> searchPatients(String query) throws RemoteException {
        return patientRepository
            .findByNomContainingOrPrenomContainingOrCinContaining(query, query, query, PageRequest.of(0, 20))
            .stream().map(patientMapper::toResponse).toList();
    }

    @Override
    public DashboardStatsResponse getStatistiques() throws RemoteException {
        return dashboardService.getStats();
    }
}
