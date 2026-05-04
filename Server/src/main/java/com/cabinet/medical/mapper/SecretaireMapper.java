package com.cabinet.medical.mapper;

import com.cabinet.medical.dto.response.SecretaireResponse;
import com.cabinet.medical.entity.Secretaire;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SecretaireMapper {

    @Mapping(target = "email", expression = "java(secretaire.getUser() != null ? secretaire.getUser().getEmail() : null)")
    SecretaireResponse toResponse(Secretaire secretaire);
}
