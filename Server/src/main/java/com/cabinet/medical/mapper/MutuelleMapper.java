package com.cabinet.medical.mapper;

import com.cabinet.medical.dto.response.MutuelleResponse;
import com.cabinet.medical.entity.Mutuelle;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface MutuelleMapper {

    @Mapping(target = "patientId", source = "patient.id")
    @Mapping(target = "patientNom", source = "patient.nom")
    @Mapping(target = "patientPrenom", source = "patient.prenom")
    MutuelleResponse toResponse(Mutuelle mutuelle);
}
