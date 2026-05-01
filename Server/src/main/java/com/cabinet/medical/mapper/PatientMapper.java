package com.cabinet.medical.mapper;

import com.cabinet.medical.dto.response.PatientResponse;
import com.cabinet.medical.entity.Patient;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PatientMapper {

    @Mapping(target = "email", expression = "java(patient.getUser() != null ? patient.getUser().getEmail() : null)")
    PatientResponse toResponse(Patient patient);
}
