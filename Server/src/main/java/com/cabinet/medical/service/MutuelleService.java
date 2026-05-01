package com.cabinet.medical.service;

import com.cabinet.medical.dto.request.MutuelleRequest;
import com.cabinet.medical.dto.response.MutuelleResponse;
import com.cabinet.medical.entity.Mutuelle;
import com.cabinet.medical.entity.Patient;
import com.cabinet.medical.exception.ResourceNotFoundException;
import com.cabinet.medical.mapper.MutuelleMapper;
import com.cabinet.medical.repository.MutuelleRepository;
import com.cabinet.medical.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MutuelleService {

    private final MutuelleRepository mutuelleRepository;
    private final PatientRepository patientRepository;
    private final MutuelleMapper mutuelleMapper;

    public Page<MutuelleResponse> getAll(Pageable pageable) {
        return mutuelleRepository.findAll(pageable).map(mutuelleMapper::toResponse);
    }

    public MutuelleResponse getById(Long id) {
        return mutuelleMapper.toResponse(findOrThrow(id));
    }

    public MutuelleResponse getByPatient(Long patientId) {
        return mutuelleRepository.findByPatientId(patientId)
            .map(mutuelleMapper::toResponse)
            .orElseThrow(() -> new ResourceNotFoundException("Mutuelle non trouvée pour le patient: " + patientId));
    }

    @Transactional
    public MutuelleResponse create(MutuelleRequest request) {
        Patient patient = patientRepository.findById(request.getPatientId())
            .orElseThrow(() -> new ResourceNotFoundException("Patient non trouvé"));
        Mutuelle mutuelle = Mutuelle.builder()
            .type(request.getType())
            .numeroAffiliation(request.getNumeroAffiliation())
            .organismeNom(request.getOrganismeNom())
            .dateDebut(request.getDateDebut())
            .dateFin(request.getDateFin())
            .tauxRemboursement(request.getTauxRemboursement())
            .patient(patient)
            .build();
        return mutuelleMapper.toResponse(mutuelleRepository.save(mutuelle));
    }

    @Transactional
    public MutuelleResponse update(Long id, MutuelleRequest request) {
        Mutuelle m = findOrThrow(id);
        m.setType(request.getType());
        m.setNumeroAffiliation(request.getNumeroAffiliation());
        m.setOrganismeNom(request.getOrganismeNom());
        m.setDateDebut(request.getDateDebut());
        m.setDateFin(request.getDateFin());
        m.setTauxRemboursement(request.getTauxRemboursement());
        return mutuelleMapper.toResponse(mutuelleRepository.save(m));
    }

    private Mutuelle findOrThrow(Long id) {
        return mutuelleRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Mutuelle non trouvée avec l'id: " + id));
    }
}
