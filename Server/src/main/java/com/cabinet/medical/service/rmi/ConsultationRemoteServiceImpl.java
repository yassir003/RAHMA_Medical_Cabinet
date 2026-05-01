package com.cabinet.medical.service.rmi;

import com.cabinet.medical.dto.response.ConsultationResponse;
import com.cabinet.medical.mapper.ConsultationMapper;
import com.cabinet.medical.repository.ConsultationRepository;
import com.cabinet.medical.repository.MedecinRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.rmi.RemoteException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ConsultationRemoteServiceImpl implements IConsultationRemoteService {

    private final ConsultationRepository consultationRepository;
    private final ConsultationMapper consultationMapper;
    private final MedecinRepository medecinRepository;

    @Override
    public List<ConsultationResponse> getHistorique(Long patientId) throws RemoteException {
        return consultationRepository.findByPatientId(patientId, PageRequest.of(0, 50))
            .stream().map(consultationMapper::toResponse).toList();
    }

    @Override
    public ConsultationResponse getConsultationById(Long id) throws RemoteException {
        return consultationRepository.findById(id)
            .map(consultationMapper::toResponse)
            .orElseThrow(() -> new RemoteException("Consultation non trouvée: " + id));
    }

    @Override
    public Map<String, Long> getStatsParMedecin() throws RemoteException {
        Map<String, Long> stats = new HashMap<>();
        medecinRepository.findAll().forEach(m ->
            stats.put(m.getNom() + " " + m.getPrenom(),
                consultationRepository.countByMedecinId(m.getId())));
        return stats;
    }
}
