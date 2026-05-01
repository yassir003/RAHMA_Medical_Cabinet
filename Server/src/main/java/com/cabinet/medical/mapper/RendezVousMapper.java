package com.cabinet.medical.mapper;

import com.cabinet.medical.dto.response.RendezVousResponse;
import com.cabinet.medical.entity.RendezVous;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface RendezVousMapper {

    @Mapping(target = "patientId", source = "patient.id")
    @Mapping(target = "patientNom", source = "patient.nom")
    @Mapping(target = "patientPrenom", source = "patient.prenom")
    @Mapping(target = "medecinId", source = "medecin.id")
    @Mapping(target = "medecinNom", source = "medecin.nom")
    @Mapping(target = "medecinPrenom", source = "medecin.prenom")
    @Mapping(target = "medecinSpecialite", source = "medecin.specialite")
    RendezVousResponse toResponse(RendezVous rendezVous);
}
