package com.cabinet.medical.service;

import com.cabinet.medical.dto.request.SecretaireRequest;
import com.cabinet.medical.dto.response.SecretaireResponse;
import com.cabinet.medical.entity.Secretaire;
import com.cabinet.medical.entity.User;
import com.cabinet.medical.enums.Role;
import com.cabinet.medical.exception.ResourceNotFoundException;
import com.cabinet.medical.repository.SecretaireRepository;
import com.cabinet.medical.repository.UserRepository;
import com.cabinet.medical.mapper.SecretaireMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class SecretaireService {

    private final SecretaireRepository secretaireRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecretaireMapper secretaireMapper;

    public Page<SecretaireResponse> getAll(String search, Pageable pageable) {
        if (StringUtils.hasText(search)) {
            return secretaireRepository.findByNomContainingOrPrenomContaining(search, search, pageable)
                    .map(secretaireMapper::toResponse);
        }
        return secretaireRepository.findAll(pageable).map(secretaireMapper::toResponse);
    }

    public SecretaireResponse getById(Long id) {
        return secretaireMapper.toResponse(findOrThrow(id));
    }

    private Secretaire findOrThrow(Long id) {
        return secretaireRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Secrétaire non trouvé avec l'id: " + id));
    }

    @Transactional
    public SecretaireResponse create(SecretaireRequest request) {
        User user = User.builder()
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .role(Role.SECRETAIRE)
            .enabled(true)
            .build();
        userRepository.save(user);
        Secretaire secretaire = Secretaire.builder()
            .nom(request.getNom())
            .prenom(request.getPrenom())
            .telephone(request.getTelephone())
            .user(user)
            .build();
        return secretaireMapper.toResponse(secretaireRepository.save(secretaire));
    }

    @Transactional
    public SecretaireResponse update(Long id, SecretaireRequest request) {
        Secretaire s = findOrThrow(id);
        s.setNom(request.getNom());
        s.setPrenom(request.getPrenom());
        s.setTelephone(request.getTelephone());
        return secretaireMapper.toResponse(secretaireRepository.save(s));
    }

    @Transactional
    public void delete(Long id) {
        Secretaire secretaire = findOrThrow(id);
        User user = secretaire.getUser();
        secretaireRepository.deleteById(id);
        if (user != null) {
            userRepository.delete(user);
        }
    }
}
