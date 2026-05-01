package com.cabinet.medical.mapper;

import com.cabinet.medical.dto.response.MedecinResponse;
import com.cabinet.medical.entity.Medecin;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface MedecinMapper {

    @Mapping(target = "email", expression = "java(medecin.getUser() != null ? medecin.getUser().getEmail() : null)")
    MedecinResponse toResponse(Medecin medecin);
}
