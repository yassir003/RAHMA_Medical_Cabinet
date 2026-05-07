package com.cabinet.medical.mapper;

import com.cabinet.medical.dto.response.ConsultationResponse;
import com.cabinet.medical.entity.Consultation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ConsultationMapper {

    @Mapping(target = "patientId", source = "patient.id")
    @Mapping(target = "patientNom", source = "patient.nom")
    @Mapping(target = "patientPrenom", source = "patient.prenom")
    @Mapping(target = "patientCin", source = "patient.cin")
    @Mapping(target = "medecinId", source = "medecin.id")
    @Mapping(target = "medecinNom", source = "medecin.nom")
    @Mapping(target = "medecinPrenom", source = "medecin.prenom")
    @Mapping(target = "medecinSpecialite", source = "medecin.specialite")
    @Mapping(target = "rendezVousId", source = "rendezVous.id")
    ConsultationResponse toResponse(Consultation consultation);
}
