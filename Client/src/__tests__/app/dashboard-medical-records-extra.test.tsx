import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DoctorPatientsPage from "@/app/dashboard/doctors/patients/page";
import ConsultationDetailPage from "@/app/dashboard/doctors/consultations/[id]/page";
import PatientDossierPage from "@/app/dashboard/doctors/patients/[id]/page";
import NouvelleOrdonnancePage from "@/app/dashboard/ordonnances/nouvelle/page";
import OrdonnanceDetailPage from "@/app/dashboard/ordonnances/[id]/page";
import ConsultationReportPage from "@/app/dashboard/reports/[id]/page";
import { useAuth } from "@/context/AuthContext";
import {
  annulerOrdonnance,
  createOrdonnance,
  downloadOrdonnancePdf,
  getConsultationById,
  getConsultationReport,
  getConsultationsByMedecinMe,
  getMyPatientsAsMedecin,
  getOrdonnanceById,
  getPatientById,
  getPatientConsultations,
  getPatientRendezVous,
  updateConsultation,
} from "@/lib/api";

let mockParams: Record<string, string> = { id: "7" };
const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock("next/navigation", () => ({
  useParams: () => mockParams,
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/lib/api", () => ({
  annulerOrdonnance: jest.fn(),
  createOrdonnance: jest.fn(),
  downloadOrdonnancePdf: jest.fn(),
  getConsultationById: jest.fn(),
  getConsultationReport: jest.fn(),
  getConsultationsByMedecinMe: jest.fn(),
  getMyPatientsAsMedecin: jest.fn(),
  getOrdonnanceById: jest.fn(),
  getPatientById: jest.fn(),
  getPatientConsultations: jest.fn(),
  getPatientRendezVous: jest.fn(),
  updateConsultation: jest.fn(),
}));

const patient = {
  id: 7,
  nom: "Doe",
  prenom: "Alice",
  cin: "AB123456",
  dateNaissance: "1990-01-01",
  telephone: "0600000000",
  adresse: "Casablanca",
  groupeSanguin: "O+",
  allergies: "Pollen",
  antecedents: "Asthma",
  email: "alice@mail.com",
};

const consultation = {
  id: 88,
  dateVisite: "2026-05-14T09:00:00",
  motif: "Annual exam",
  diagnostic: "Stable patient",
  diagnosticPatient: "Everything is stable.",
  notes: "Clinical notes",
  actesRealises: "ECG",
  montantTotal: 300,
  patientId: 7,
  patientNom: "Doe",
  patientPrenom: "Alice",
  patientCin: "AB123456",
  medecinId: 4,
  medecinNom: "House",
  medecinPrenom: "Gregory",
  medecinSpecialite: "Cardiologue",
  rendezVousId: 30,
};

const rendezVous = {
  id: 30,
  dateHeure: "2026-05-15T10:00:00",
  motif: "Follow-up",
  notes: "Bring reports",
  statut: "CONFIRME",
  patientId: 7,
  patientNom: "Doe",
  patientPrenom: "Alice",
  medecinId: 4,
  medecinNom: "House",
  medecinPrenom: "Gregory",
  medecinSpecialite: "Cardiologue",
};

const ordonnance = {
  id: 22,
  statut: "ACTIVE",
  dateCreation: "2026-05-14T10:00:00",
  dureeTraitement: "7 jours",
  instructions: "Drink water",
  patient: { id: 7, nom: "Doe", prenom: "Alice", cin: "AB123456" },
  medecin: { id: 4, nom: "House", prenom: "Gregory", specialite: "Cardiologue" },
  consultation: { id: 88, dateVisite: "2026-05-14T09:00:00", motif: "Annual exam" },
  medicaments: [
    {
      id: 1,
      nomMedicament: "Amoxicilline",
      dosage: "500mg",
      frequence: "3 fois par jour",
      duree: "7 jours",
      instructions: "Apres repas",
    },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = { id: "7" };
  window.history.pushState({}, "", "/dashboard");
  (useAuth as jest.Mock).mockReturnValue({ user: { role: "MEDECIN" } });
  (getMyPatientsAsMedecin as jest.Mock).mockResolvedValue({ content: [patient], totalElements: 1, totalPages: 1 });
  (getPatientById as jest.Mock).mockResolvedValue(patient);
  (getPatientConsultations as jest.Mock).mockResolvedValue({ content: [consultation], totalElements: 1, totalPages: 1 });
  (getPatientRendezVous as jest.Mock).mockResolvedValue({ content: [rendezVous], totalElements: 1, totalPages: 1 });
  (getConsultationsByMedecinMe as jest.Mock).mockResolvedValue({ content: [consultation], totalElements: 1, totalPages: 1 });
  (getConsultationById as jest.Mock).mockResolvedValue(consultation);
  (updateConsultation as jest.Mock).mockResolvedValue({ ...consultation, diagnostic: "Updated diagnosis", montantTotal: 450 });
  (createOrdonnance as jest.Mock).mockResolvedValue(ordonnance);
  (downloadOrdonnancePdf as jest.Mock).mockResolvedValue(undefined);
  (getOrdonnanceById as jest.Mock).mockResolvedValue(ordonnance);
  (annulerOrdonnance as jest.Mock).mockResolvedValue({ ...ordonnance, statut: "ANNULEE" });
  (getConsultationReport as jest.Mock).mockResolvedValue({ ...consultation, ordonnance });
  jest.spyOn(window, "alert").mockImplementation(() => undefined);
  jest.spyOn(window, "confirm").mockReturnValue(true);
  jest.spyOn(window, "print").mockImplementation(() => undefined);
});

afterEach(() => {
  (window.alert as jest.Mock).mockRestore();
  (window.confirm as jest.Mock).mockRestore();
  (window.print as jest.Mock).mockRestore();
});

describe("dashboard medical records extra pages", () => {
  it("should render doctor patient list, search, and navigate to the dossier", async () => {
    render(<DoctorPatientsPage />);

    await waitFor(() => expect(screen.getByText("Alice Doe")).toBeInTheDocument());
    expect(getMyPatientsAsMedecin).toHaveBeenCalledWith(0, 200, "");

    await userEvent.type(screen.getByPlaceholderText(/Rechercher par nom/), "Alice");
    await waitFor(() => expect(getMyPatientsAsMedecin).toHaveBeenCalledWith(0, 200, "Alice"), { timeout: 1200 });

    await userEvent.click(screen.getByTitle(/Voir le dossier/));
    expect(mockPush).toHaveBeenCalledWith("/dashboard/doctors/patients/7");
  });

  it("should render patient dossier tabs and navigate from consultation history", async () => {
    mockParams = { id: "7" };

    render(<PatientDossierPage />);

    await waitFor(() => expect(screen.getByText(/Dossier/)).toBeInTheDocument());
    expect(screen.getAllByText("Alice Doe").length).toBeGreaterThan(0);
    expect(screen.getByText(/Stable patient/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Rendez-vous/ }));
    expect(screen.getByText(/Follow-up/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Informations personnelles/ }));
    expect(screen.getAllByText("AB123456").length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole("button", { name: /Historique/ }));
    await userEvent.click(screen.getByText(/Stable patient/));
    expect(mockPush).toHaveBeenCalledWith("/dashboard/doctors/consultations/88");
  });

  it("should show patient dossier not-found state when loading fails", async () => {
    (getPatientById as jest.Mock).mockRejectedValueOnce(new Error("No patient"));

    render(<PatientDossierPage />);

    expect(await screen.findByText(/Patient introuvable/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Retour/ }));
    expect(mockBack).toHaveBeenCalled();
  });

  it("should edit and validate a doctor consultation detail", async () => {
    mockParams = { id: "88" };
    (getConsultationById as jest.Mock).mockResolvedValueOnce({
      ...consultation,
      diagnostic: "",
      notes: "",
      actesRealises: "",
      montantTotal: undefined,
    });

    render(<ConsultationDetailPage />);

    expect(await screen.findByText(/Fiche de consultation #88/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Valider la consultation/ })).toBeDisabled();

    await userEvent.type(screen.getByPlaceholderText(/diagnostic ici/), "Updated diagnosis");
    await userEvent.type(screen.getByPlaceholderText(/Observations cliniques/), "Observation text");
    await userEvent.type(screen.getByPlaceholderText(/ECG/), "ECG and blood test");
    await userEvent.type(screen.getByPlaceholderText("0.00"), "450");
    await userEvent.click(screen.getByRole("button", { name: /Valider la consultation/ }));

    await waitFor(() => expect(updateConsultation).toHaveBeenCalledWith(88, expect.objectContaining({
      patientId: 7,
      medecinId: 4,
      diagnostic: "Updated diagnosis",
      notes: "Observation text",
      actesRealises: "ECG and blood test",
      montantTotal: 450,
    })));
    expect(screen.getByText(/Consultation valid/)).toBeInTheDocument();
  });

  it("should show consultation detail not-found state and navigate back", async () => {
    mockParams = { id: "88" };
    (getConsultationById as jest.Mock).mockRejectedValueOnce(new Error("Consultation missing"));

    render(<ConsultationDetailPage />);

    expect(await screen.findByText(/Consultation introuvable/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Retour/ }));

    expect(mockBack).toHaveBeenCalled();
  });

  it("should validate and create an ordonnance with PDF download", async () => {
    window.history.pushState({}, "", "/dashboard/ordonnances/nouvelle?consultationId=88");

    render(<NouvelleOrdonnancePage />);

    await waitFor(() => expect(screen.getAllByText("Alice Doe").length).toBeGreaterThan(0));
    await userEvent.click(screen.getByRole("button", { name: /Creer l'ordonnance/ }));
    expect(screen.getByText(/duree du traitement/)).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText(/7 jours, 1 mois/), "7 jours");
    await userEvent.type(screen.getByPlaceholderText("Instructions optionnelles"), "Take after meals");
    await userEvent.type(screen.getByPlaceholderText("Amoxicilline"), "Amoxicilline");
    await userEvent.type(screen.getByPlaceholderText("500mg"), "500mg");
    await userEvent.type(screen.getByPlaceholderText("3 fois par jour"), "3 fois par jour");
    await userEvent.type(screen.getByPlaceholderText("7 jours"), "7 jours");
    await userEvent.type(screen.getByPlaceholderText("Apres les repas"), "After lunch");
    await userEvent.click(screen.getByRole("button", { name: /Creer l'ordonnance/ }));

    await waitFor(() => expect(createOrdonnance).toHaveBeenCalledWith(expect.objectContaining({
      consultationId: 88,
      dureeTraitement: "7 jours",
      instructions: "Take after meals",
      medicaments: [expect.objectContaining({ nomMedicament: "Amoxicilline", dosage: "500mg" })],
    })));
    expect(downloadOrdonnancePdf).toHaveBeenCalledWith(22, "Doe");
    expect(mockPush).toHaveBeenCalledWith("/dashboard/reports/88");
  });

  it("should render ordonnance detail, download PDF, and cancel active ordonnance", async () => {
    mockParams = { id: "22" };

    render(<OrdonnanceDetailPage />);

    expect(await screen.findByText(/Ordonnance N ORD-22/)).toBeInTheDocument();
    expect(screen.getByText("Amoxicilline")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Telecharger PDF/ }));
    expect(downloadOrdonnancePdf).toHaveBeenCalledWith(22, "Doe");

    await userEvent.click(screen.getByRole("button", { name: /Annuler/ }));
    await waitFor(() => expect(annulerOrdonnance).toHaveBeenCalledWith(22));
    expect(getOrdonnanceById).toHaveBeenCalledTimes(2);
  });

  it("should render consultation report for doctor and trigger print and PDF actions", async () => {
    mockParams = { id: "88" };

    render(<ConsultationReportPage />);

    expect(await screen.findByText(/Rapport de Consultation/)).toBeInTheDocument();
    expect(screen.getByText("Stable patient")).toBeInTheDocument();
    expect(screen.getByText(/Ordonnance associee/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Imprimer/ }));
    expect(window.print).toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "PDF" }));
    expect(downloadOrdonnancePdf).toHaveBeenCalledWith(22, "Doe");
  });

  it("should render patient-safe consultation report without clinical diagnosis", async () => {
    mockParams = { id: "88" };
    (useAuth as jest.Mock).mockReturnValue({ user: { role: "PATIENT" } });

    render(<ConsultationReportPage />);

    expect(await screen.findByText(/Rapport de Consultation/)).toBeInTheDocument();
    expect(screen.getByText("Everything is stable.")).toBeInTheDocument();
    expect(screen.queryByText("Stable patient")).not.toBeInTheDocument();
  });
});
