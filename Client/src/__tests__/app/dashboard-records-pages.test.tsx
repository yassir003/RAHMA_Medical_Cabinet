import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OrdonnancesPage from "@/app/dashboard/ordonnances/page";
import PatientMedicalPage from "@/app/dashboard/patient/medical/page";
import ReportsPage from "@/app/dashboard/reports/page";
import { useAuth } from "@/context/AuthContext";
import {
  annulerOrdonnance,
  createDossier,
  downloadOrdonnancePdf,
  getConsultations,
  getConsultationsByMedecinMe,
  getDossiers,
  getMutuelles,
  getMyConsultations,
  getMyProfile,
  getOrdonnances,
  getPatients,
} from "@/lib/api";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/lib/api", () => ({
  getOrdonnances: jest.fn(),
  annulerOrdonnance: jest.fn(),
  downloadOrdonnancePdf: jest.fn(),
  getMyProfile: jest.fn(),
  getMyConsultations: jest.fn(),
  getDossiers: jest.fn(),
  createDossier: jest.fn(),
  getPatients: jest.fn(),
  getConsultations: jest.fn(),
  getMutuelles: jest.fn(),
  getConsultationsByMedecinMe: jest.fn(),
}));

const patient = {
  id: 7,
  nom: "Doe",
  prenom: "Alice",
  cin: "AB123456",
  email: "alice@mail.com",
  telephone: "0600000000",
  groupeSanguin: "O+",
  allergies: "Pollen",
  antecedents: "Asthma",
  dateNaissance: "1990-01-01",
};

const consultation = {
  id: 88,
  patientId: 7,
  patientNom: "Doe",
  patientPrenom: "Alice",
  patientCin: "AB123456",
  medecinId: 4,
  medecinNom: "House",
  medecinPrenom: "Gregory",
  dateVisite: "2026-05-10T09:00:00",
  motif: "Flu symptoms",
  diagnostic: "Seasonal flu",
  actesRealises: "Clinical exam",
  notes: "Rest and hydrate",
  montantTotal: 250,
};

const ordonnance = {
  id: 55,
  patient,
  medecin: { id: 4, nom: "House", prenom: "Gregory" },
  consultationId: 88,
  dateCreation: "2026-05-10T09:00:00",
  medicaments: [{ nom: "Paracetamol" }],
  dureeTraitement: "7 jours",
  statut: "ACTIVE",
};

const dossier = {
  id: 33,
  patientId: 7,
  patientNom: "Doe",
  patientPrenom: "Alice",
  consultationId: 88,
  mutuelleId: 9,
  mutuelleOrganisme: "CNSS Maroc",
  mutuelleDateAffiliation: "2024-01-01",
  mutuelleImmatriculation: "12345678",
  mutuelleSomEtabPens: "12345",
  statut: "EN_ATTENTE",
  dateCreation: "2026-05-11T10:00:00",
};

beforeEach(() => {
  jest.clearAllMocks();
  window.confirm = jest.fn(() => true);
  window.alert = jest.fn();
  (useAuth as jest.Mock).mockReturnValue({ user: { email: "admin@mail.com", role: "ADMIN" } });
  (getOrdonnances as jest.Mock).mockResolvedValue({ content: [ordonnance], totalElements: 1, totalPages: 1 });
  (annulerOrdonnance as jest.Mock).mockResolvedValue({ ...ordonnance, statut: "ANNULEE" });
  (downloadOrdonnancePdf as jest.Mock).mockResolvedValue(undefined);
  (getMyProfile as jest.Mock).mockResolvedValue(patient);
  (getMyConsultations as jest.Mock).mockResolvedValue({ content: [consultation], totalElements: 1, totalPages: 1 });
  (getDossiers as jest.Mock).mockResolvedValue({ content: [dossier], totalElements: 1, totalPages: 1 });
  (getPatients as jest.Mock).mockResolvedValue({ content: [patient], totalElements: 1, totalPages: 1 });
  (getConsultations as jest.Mock).mockResolvedValue({ content: [consultation], totalElements: 1, totalPages: 1 });
  (getMutuelles as jest.Mock).mockResolvedValue({
    content: [{ id: 9, patientId: 7, patientNom: "Doe", patientPrenom: "Alice", type: "CNSS", organismeNom: "CNSS Maroc" }],
    totalElements: 1,
    totalPages: 1,
  });
  (createDossier as jest.Mock).mockResolvedValue(dossier);
  (getConsultationsByMedecinMe as jest.Mock).mockResolvedValue({ content: [consultation], totalElements: 1, totalPages: 1 });
});

describe("dashboard records pages", () => {
  it("should render ordonnances and handle doctor actions", async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { email: "doctor@mail.com", role: "MEDECIN" } });

    render(<OrdonnancesPage />);

    await waitFor(() => expect(screen.getByText("ORD-55")).toBeInTheDocument());
    expect(screen.getByText("Alice Doe")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Nouvelle ordonnance/ }));
    await userEvent.click(screen.getByTitle("PDF"));
    await userEvent.click(screen.getByTitle("Annuler"));

    expect(mockPush).toHaveBeenCalledWith("/dashboard/ordonnances/nouvelle");
    expect(downloadOrdonnancePdf).toHaveBeenCalledWith(55, "Doe");
    await waitFor(() => expect(annulerOrdonnance).toHaveBeenCalledWith(55));
  });

  it("should filter ordonnances when search text does not match", async () => {
    render(<OrdonnancesPage />);

    await waitFor(() => expect(screen.getByText("ORD-55")).toBeInTheDocument());
    await userEvent.type(screen.getByPlaceholderText("Rechercher patient ou numero"), "unknown");

    expect(screen.getByText("Aucune ordonnance trouvee.")).toBeInTheDocument();
  });

  it("should render patient medical history and download ordonnance PDF", async () => {
    render(<PatientMedicalPage />);

    await waitFor(() => expect(screen.getByText("Alice Doe")).toBeInTheDocument());
    expect(screen.getByText("ORD-55")).toBeInTheDocument();

    await userEvent.click(screen.getByText(/Consultation du/));
    expect(screen.getByText("Seasonal flu")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "PDF" }));

    expect(downloadOrdonnancePdf).toHaveBeenCalledWith(55, "Doe");
  });

  it("should render reimbursement reports for admin users", async () => {
    render(<ReportsPage />);

    expect(screen.getByText("Dossiers de Remboursement")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Alice Doe")).toBeInTheDocument());
    expect(screen.getByText("#REP-033")).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText("Rechercher patient ou ID..."), "nobody");

    expect(screen.getByText(/Aucun dossier/)).toBeInTheDocument();
  });

  it("should create reimbursement report when required selections are provided", async () => {
    render(<ReportsPage />);

    await waitFor(() => expect(screen.getByText("Dossiers de Remboursement")).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /Nouveau dossier/ }));

    const selects = screen.getAllByRole("combobox");
    await userEvent.selectOptions(selects[0], "7");
    await userEvent.selectOptions(selects[1], "9");
    await userEvent.selectOptions(selects[2], "88");
    await userEvent.type(screen.getByPlaceholderText("Description / Nom du document"), "Facture consultation");
    await userEvent.click(screen.getByRole("button", { name: /Cr/ }));

    await waitFor(() => expect(createDossier).toHaveBeenCalledWith({
      patientId: 7,
      mutuelleId: 9,
      consultationId: 88,
      documentJustificatif: "Facture consultation",
    }));
  });

  it("should render doctor consultations and open report detail", async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { email: "doctor@mail.com", role: "MEDECIN" } });

    render(<ReportsPage />);

    expect(screen.getByText("Mes Consultations")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Alice Doe")).toBeInTheDocument());
    expect(screen.getByText("Flu symptoms")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Voir/ }));

    expect(mockPush).toHaveBeenCalledWith("/dashboard/reports/88");
  });
});
