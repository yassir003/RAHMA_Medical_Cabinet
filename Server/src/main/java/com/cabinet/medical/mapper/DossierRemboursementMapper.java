package com.cabinet.medical.mapper;

import com.cabinet.medical.dto.response.DossierRemboursementResponse;
import com.cabinet.medical.entity.DossierRemboursement;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface DossierRemboursementMapper {

    @Mapping(target = "patientId", source = "patient.id")
    @Mapping(target = "patientNom", source = "patient.nom")
    @Mapping(target = "patientPrenom", source = "patient.prenom")
    @Mapping(target = "mutuelleId", source = "mutuelle.id")
    @Mapping(target = "mutuelleOrganisme", source = "mutuelle.organismeNom")
    @Mapping(target = "consultationId", source = "consultation.id")
    DossierRemboursementResponse toResponse(DossierRemboursement dossier);
}
