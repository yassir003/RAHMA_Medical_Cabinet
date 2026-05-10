package com.cabinet.medical.service;

import com.cabinet.medical.dto.response.LigneMedicamentResponse;
import com.cabinet.medical.dto.response.OrdonnanceResponse;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.pdf.canvas.draw.DashedLine;
import com.itextpdf.kernel.pdf.canvas.draw.SolidLine;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.LineSeparator;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Component
public class PdfGenerator {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATE_TIME_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final String LOGO_PATH = "static/images/logo-light.png";

    public static byte[] generateOrdonnance(OrdonnanceResponse ordonnance) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document doc = new Document(pdf, PageSize.A4);
            doc.setMargins(36, 42, 36, 42);

            Image logo = loadLogo();
            if (logo != null) {
                logo.scaleToFit(200, 180).setHorizontalAlignment(HorizontalAlignment.CENTER);
                doc.add(new Paragraph().add(logo).setTextAlignment(TextAlignment.CENTER).setMarginBottom(8));
            }
            doc.add(new LineSeparator(new SolidLine()));

            doc.add(new Paragraph("Dr. " + text(ordonnance.getMedecin().getPrenom()) + " " + text(ordonnance.getMedecin().getNom()))
                .setFontSize(14)
                .setBold()
                .setMarginTop(18));
            doc.add(new Paragraph("Specialite : " + text(ordonnance.getMedecin().getSpecialite()))
                .setFontSize(11)
                .setFontColor(ColorConstants.GRAY));

            doc.add(new Paragraph("ORDONNANCE MEDICALE")
                .setFontSize(16)
                .setBold()
                .setTextAlignment(TextAlignment.CENTER)
                .setBackgroundColor(new DeviceRgb(230, 241, 251))
                .setPadding(10)
                .setMarginTop(22));

            Table info = new Table(UnitValue.createPercentArray(new float[] { 1, 1 }))
                .setWidth(UnitValue.createPercentValue(100))
                .setMarginTop(18);
            info.addCell(labelCell("Patient(e)"));
            info.addCell(valueCell(text(ordonnance.getPatient().getPrenom()) + " " + text(ordonnance.getPatient().getNom())));
            info.addCell(labelCell("Date"));
            info.addCell(valueCell(ordonnance.getDateCreation() != null ? ordonnance.getDateCreation().format(DATE_FORMAT) : "-"));
            info.addCell(labelCell("N ordonnance"));
            info.addCell(valueCell("ORD-" + ordonnance.getId()));
            doc.add(info);

            doc.add(new Paragraph("Prescription :").setBold().setFontSize(13).setMarginTop(22));
            doc.add(new LineSeparator(new DashedLine()));

            int index = 1;
            for (LigneMedicamentResponse med : ordonnance.getMedicaments()) {
                doc.add(new Paragraph(index + ". " + text(med.getNomMedicament()))
                    .setBold()
                    .setFontSize(12)
                    .setMarginTop(10));

                Table table = new Table(UnitValue.createPercentArray(new float[] { 1, 2 }))
                    .setWidth(UnitValue.createPercentValue(100));
                addMedicationRow(table, "Dosage", med.getDosage());
                addMedicationRow(table, "Frequence", med.getFrequence());
                addMedicationRow(table, "Duree", med.getDuree());
                if (med.getInstructions() != null && !med.getInstructions().isBlank()) {
                    addMedicationRow(table, "Instructions", med.getInstructions());
                }
                doc.add(table);
                index++;
            }

            if (ordonnance.getInstructions() != null && !ordonnance.getInstructions().isBlank()) {
                doc.add(new Paragraph("Instructions generales :").setBold().setMarginTop(18));
                doc.add(new Paragraph(ordonnance.getInstructions()).setFontSize(11).setItalic());
            }

            doc.add(new Paragraph("Duree du traitement : " + text(ordonnance.getDureeTraitement()))
                .setBold()
                .setMarginTop(18));

            doc.add(new Paragraph("\n\n"));
            doc.add(new LineSeparator(new SolidLine()));
            doc.add(new Paragraph("Signature et cachet du medecin")
                .setTextAlignment(TextAlignment.RIGHT)
                .setFontSize(11)
                .setItalic()
                .setFontColor(ColorConstants.GRAY));

            doc.add(new Paragraph("Ordonnance generee le " + LocalDateTime.now().format(DATE_TIME_FORMAT) + " - Cabinet Medical Rahma")
                .setFontSize(9)
                .setFontColor(ColorConstants.GRAY)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(24));

            doc.close();
            return baos.toByteArray();
        } catch (Exception ex) {
            throw new RuntimeException("Erreur generation PDF ordonnance", ex);
        }
    }

    private static void addMedicationRow(Table table, String label, String value) {
        table.addCell(labelCell(label).setBackgroundColor(new DeviceRgb(240, 240, 240)));
        table.addCell(valueCell(text(value)));
    }

    private static Cell labelCell(String text) {
        return new Cell().add(new Paragraph(text).setBold()).setBorder(Border.NO_BORDER).setPadding(6);
    }

    private static Cell valueCell(String text) {
        return new Cell().add(new Paragraph(text)).setBorder(Border.NO_BORDER).setPadding(6);
    }

    private static Image loadLogo() {
        try (InputStream input = PdfGenerator.class.getClassLoader().getResourceAsStream(LOGO_PATH)) {
            if (input == null) {
                return null;
            }
            return new Image(ImageDataFactory.create(input.readAllBytes()));
        } catch (Exception ex) {
            return null;
        }
    }

    private static String text(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }
}