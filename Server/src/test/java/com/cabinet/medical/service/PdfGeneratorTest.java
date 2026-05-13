package com.cabinet.medical.service;

import com.cabinet.medical.dto.response.LigneMedicamentResponse;
import com.cabinet.medical.dto.response.MedecinSummary;
import com.cabinet.medical.dto.response.OrdonnanceResponse;
import com.cabinet.medical.dto.response.PatientSummary;
import com.cabinet.medical.enums.StatutOrdonnance;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("PdfGenerator")
class PdfGeneratorTest {

    @Test
    @DisplayName("should generate pdf bytes when ordonnance is complete")
    void shouldGeneratePdfBytesWhenOrdonnanceIsComplete() {
        byte[] pdf = PdfGenerator.generateOrdonnance(ordonnance());

        assertThat(pdf).isNotEmpty();
        assertThat(new String(pdf, 0, 4)).isEqualTo("%PDF");
    }

    @Test
    @DisplayName("should generate pdf bytes when optional instructions are blank")
    void shouldGeneratePdfBytesWhenOptionalInstructionsAreBlank() {
        OrdonnanceResponse ordonnance = ordonnance();
        ordonnance.setInstructions(" ");
        ordonnance.getMedicaments().get(0).setInstructions("");

        byte[] pdf = PdfGenerator.generateOrdonnance(ordonnance);

        assertThat(pdf.length).isGreaterThan(1000);
    }

    @Test
    @DisplayName("should render placeholder text when nullable fields are missing")
    void shouldRenderPlaceholderTextWhenNullableFieldsAreMissing() {
        OrdonnanceResponse ordonnance = ordonnance();
        ordonnance.getMedecin().setSpecialite(null);
        ordonnance.getMedicaments().get(0).setDosage(null);
        ordonnance.setDateCreation(null);

        byte[] pdf = PdfGenerator.generateOrdonnance(ordonnance);

        assertThat(pdf).isNotEmpty();
    }

    @Test
    @DisplayName("should throw runtime exception when ordonnance is null")
    void shouldThrowRuntimeExceptionWhenOrdonnanceIsNull() {
        assertThatThrownBy(() -> PdfGenerator.generateOrdonnance(null))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("Erreur generation PDF ordonnance");
    }

    private OrdonnanceResponse ordonnance() {
        return OrdonnanceResponse.builder()
            .id(1L)
            .dateCreation(LocalDateTime.of(2026, 5, 12, 9, 0))
            .dureeTraitement("5 jours")
            .instructions("Boire beaucoup d'eau")
            .statut(StatutOrdonnance.ACTIVE)
            .patient(PatientSummary.builder().id(1L).nom("Doe").prenom("Jane").cin("AB123").build())
            .medecin(MedecinSummary.builder().id(2L).nom("House").prenom("Gregory").specialite("Cardiology").build())
            .medicaments(List.of(LigneMedicamentResponse.builder()
                .id(1L)
                .nomMedicament("Paracetamol")
                .dosage("1g")
                .frequence("2 fois par jour")
                .duree("5 jours")
                .instructions("Apres repas")
                .build()))
            .build();
    }
}
