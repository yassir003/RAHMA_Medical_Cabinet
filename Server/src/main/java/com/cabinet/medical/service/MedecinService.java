package com.cabinet.medical.service;

import com.cabinet.medical.dto.request.MedecinRequest;
import com.cabinet.medical.dto.response.MedecinResponse;
import com.cabinet.medical.entity.Medecin;
import com.cabinet.medical.entity.User;
import com.cabinet.medical.enums.Role;
import com.cabinet.medical.exception.ResourceNotFoundException;
import com.cabinet.medical.mapper.MedecinMapper;
import com.cabinet.medical.repository.MedecinRepository;
import com.cabinet.medical.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class MedecinService {

    private final MedecinRepository medecinRepository;
    private final UserRepository userRepository;
    private final MedecinMapper medecinMapper;
    private final PasswordEncoder passwordEncoder;

    public Page<MedecinResponse> getAll(String search, Pageable pageable) {
        if (StringUtils.hasText(search)) {
            return medecinRepository
                .findByNomContainingOrPrenomContainingOrSpecialiteContaining(search, search, search, pageable)
                .map(medecinMapper::toResponse);
        }
        return medecinRepository.findAll(pageable).map(medecinMapper::toResponse);
    }

    public MedecinResponse getById(Long id) {
        return medecinMapper.toResponse(findOrThrow(id));
    }

    @Transactional
    public MedecinResponse create(MedecinRequest request) {
        User user = User.builder()
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .role(Role.MEDECIN)
            .enabled(true)
            .build();
        userRepository.save(user);
        Medecin medecin = Medecin.builder()
            .nom(request.getNom())
            .prenom(request.getPrenom())
            .specialite(request.getSpecialite())
            .telephone(request.getTelephone())
            .user(user)
            .build();
        return medecinMapper.toResponse(medecinRepository.save(medecin));
    }

    @Transactional
    public MedecinResponse update(Long id, MedecinRequest request) {
        Medecin medecin = findOrThrow(id);
        medecin.setNom(request.getNom());
        medecin.setPrenom(request.getPrenom());
        medecin.setSpecialite(request.getSpecialite());
        medecin.setTelephone(request.getTelephone());
        return medecinMapper.toResponse(medecinRepository.save(medecin));
    }

    @Transactional
    public void delete(Long id) {
        findOrThrow(id);
        medecinRepository.deleteById(id);
    }

    private Medecin findOrThrow(Long id) {
        return medecinRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Médecin non trouvé avec l'id: " + id));
    }
}
