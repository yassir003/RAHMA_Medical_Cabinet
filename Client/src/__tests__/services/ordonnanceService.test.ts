import {
  annulerOrdonnance,
  createOrdonnance,
  downloadOrdonnancePdf,
  getOrdonnanceById,
  getOrdonnances,
  getOrdonnancesByPatient,
} from "@/lib/api";
import { ordonnanceService } from "@/services/ordonnanceService";

jest.mock("@/lib/api", () => ({
  annulerOrdonnance: jest.fn(),
  createOrdonnance: jest.fn(),
  downloadOrdonnancePdf: jest.fn(),
  getOrdonnanceById: jest.fn(),
  getOrdonnances: jest.fn(),
  getOrdonnancesByPatient: jest.fn(),
}));

describe("ordonnanceService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should delegate create when creating ordonnance", () => {
    const payload = { consultationId: 1, dureeTraitement: "5 jours", medicaments: [] };

    ordonnanceService.create(payload);

    expect(createOrdonnance).toHaveBeenCalledWith(payload);
  });

  it("should delegate getById when loading ordonnance details", () => {
    ordonnanceService.getById(8);

    expect(getOrdonnanceById).toHaveBeenCalledWith(8);
  });

  it("should delegate getAll with filters when listing ordonnances", () => {
    ordonnanceService.getAll(2, 15, "ACTIVE", "doe");

    expect(getOrdonnances).toHaveBeenCalledWith(2, 15, "ACTIVE", "doe");
  });

  it("should delegate getByPatient when loading patient ordonnances", () => {
    ordonnanceService.getByPatient(4, 1, 10);

    expect(getOrdonnancesByPatient).toHaveBeenCalledWith(4, 1, 10);
  });

  it("should delegate annuler when cancelling ordonnance", () => {
    ordonnanceService.annuler(3);

    expect(annulerOrdonnance).toHaveBeenCalledWith(3);
  });

  it("should delegate downloadPdf when downloading ordonnance pdf", () => {
    ordonnanceService.downloadPdf(9, "Doe");

    expect(downloadOrdonnancePdf).toHaveBeenCalledWith(9, "Doe");
  });
});
