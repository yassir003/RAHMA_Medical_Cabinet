import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MutualsPage from "@/app/dashboard/mutuals/page";
import {
  createDossier,
  createMutuelle,
  deleteMutuelle,
  getDossiers,
  getMutuelleByPatient,
  getMutuelles,
  getPatientConsultations,
  getPatients,
  updateDossierStatut,
  updateMutuelle,
} from "@/lib/api";

jest.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {},
  getMutuelles: jest.fn(),
  createMutuelle: jest.fn(),
  updateMutuelle: jest.fn(),
  deleteMutuelle: jest.fn(),
  getDossiers: jest.fn(),
  createDossier: jest.fn(),
  updateDossierStatut: jest.fn(),
  getMutuelleByPatient: jest.fn(),
  getPatientConsultations: jest.fn(),
  getPatients: jest.fn(),
}));

const patient = {
  id: 7,
  nom: "Doe",
  prenom: "Alice",
  cin: "AB123456",
  dateNaissance: "1990-01-01",
  telephone: "0600000000",
  adresse: "Casablanca",
};

const mutuelle = {
  id: 3,
  type: "CNSS",
  numeroAffiliation: "AFF-123",
  organismeNom: "CNSS Maroc",
  dateAffiliation: "2026-01-01",
  immatriculation: 123456789,
  somEtabPens: 4567,
  patientId: 7,
  patientNom: "Doe",
  patientPrenom: "Alice",
};

const consultation = {
  id: 88,
  dateVisite: "2026-05-14T09:00:00",
  motif: "Annual exam",
  montantTotal: 300,
  patientId: 7,
  patientNom: "Doe",
  patientPrenom: "Alice",
  medecinId: 4,
  medecinNom: "House",
  medecinPrenom: "Gregory",
};

const dossier = {
  id: 12,
  dateCreation: "2026-05-14",
  statut: "EN_ATTENTE",
  patientId: 7,
  patientNom: "Doe",
  patientPrenom: "Alice",
  mutuelleId: 3,
  mutuelleOrganisme: "CNSS Maroc",
  mutuelleDateAffiliation: "2026-01-01",
  mutuelleImmatriculation: 123456789,
  mutuelleSomEtabPens: 4567,
  consultationId: 88,
};

beforeEach(() => {
  jest.clearAllMocks();
  (getMutuelles as jest.Mock).mockResolvedValue({ content: [mutuelle], totalElements: 1, totalPages: 2 });
  (createMutuelle as jest.Mock).mockResolvedValue({ ...mutuelle, id: 4, organismeNom: "CNOPS Maroc", type: "CNOPS" });
  (updateMutuelle as jest.Mock).mockResolvedValue({ ...mutuelle, organismeNom: "Updated CNSS" });
  (deleteMutuelle as jest.Mock).mockResolvedValue(undefined);
  (getDossiers as jest.Mock).mockResolvedValue({ content: [dossier], totalElements: 1, totalPages: 2 });
  (createDossier as jest.Mock).mockResolvedValue({ ...dossier, id: 13 });
  (updateDossierStatut as jest.Mock).mockResolvedValue({ ...dossier, statut: "ENVOYE" });
  (getMutuelleByPatient as jest.Mock).mockResolvedValue(mutuelle);
  (getPatientConsultations as jest.Mock).mockResolvedValue({ content: [consultation], totalElements: 1, totalPages: 1 });
  (getPatients as jest.Mock).mockResolvedValue({ content: [patient], totalElements: 1, totalPages: 1 });
});

async function selectAlicePatient() {
  await userEvent.type(screen.getByPlaceholderText(/Rechercher par nom/), "Alice");
  await waitFor(() => expect(getPatients).toHaveBeenCalledWith(0, 8, "Alice"), { timeout: 2000 });
  await userEvent.click(await screen.findByRole("button", { name: /Alice Doe/ }));
}

describe("dashboard mutuals page", () => {
  it("should render affiliations and update an existing mutuelle", async () => {
    render(<MutualsPage />);

    await waitFor(() => expect(screen.getByText("Gestion des Mutuelles")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("Alice Doe")).toBeInTheDocument());
    expect(screen.getByText("CNSS Maroc")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Modifier/ }));
    await userEvent.clear(screen.getByPlaceholderText("Ex: CNSS Maroc"));
    await userEvent.type(screen.getByPlaceholderText("Ex: CNSS Maroc"), "Updated CNSS");
    await userEvent.click(screen.getByRole("button", { name: /^Enregistrer$/ }));

    await waitFor(() => expect(updateMutuelle).toHaveBeenCalledWith(3, expect.objectContaining({
      patientId: 7,
      organismeNom: "Updated CNSS",
      immatriculation: 123456789,
    })));
  });

  it("should create a new mutuelle after selecting a patient", async () => {
    const { container } = render(<MutualsPage />);

    await waitFor(() => expect(screen.getByText("Alice Doe")).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /Nouvelle affiliation/ }));
    await userEvent.click(screen.getByRole("button", { name: /^Enregistrer$/ }));
    expect(screen.getByText(/patient et un type/)).toBeInTheDocument();

    await selectAlicePatient();
    await userEvent.selectOptions(screen.getByRole("combobox"), "CNOPS");
    await userEvent.type(screen.getByPlaceholderText("Ex: CNSS Maroc"), "CNOPS Maroc");
    await userEvent.type(screen.getByPlaceholderText("Ex: 12345678"), "AFF-999");
    fireEvent.change(container.querySelector('input[type="date"]')!, { target: { value: "2026-02-02" } });
    await userEvent.type(screen.getByPlaceholderText("9 chiffres"), "987654321");
    await userEvent.type(screen.getByPlaceholderText("Ex: 12345"), "7777");
    await userEvent.click(screen.getByRole("button", { name: /^Enregistrer$/ }));

    await waitFor(() => expect(createMutuelle).toHaveBeenCalledWith(expect.objectContaining({
      patientId: 7,
      type: "CNOPS",
      organismeNom: "CNOPS Maroc",
      numeroAffiliation: "AFF-999",
      dateAffiliation: "2026-02-02",
      immatriculation: 987654321,
      somEtabPens: 7777,
    })));
  });

  it("should delete an affiliation from the confirmation dialog", async () => {
    const { container } = render(<MutualsPage />);

    await waitFor(() => expect(screen.getByText("Alice Doe")).toBeInTheDocument());
    const tableButtons = Array.from(container.querySelectorAll("tbody button"));
    await userEvent.click(tableButtons.at(-1)!);
    expect(screen.getByText(/Supprimer cette affiliation/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /^Supprimer$/ }));

    await waitFor(() => expect(deleteMutuelle).toHaveBeenCalledWith(3));
  });

  it("should render reimbursement dossiers and update their status", async () => {
    render(<MutualsPage />);

    await userEvent.click(screen.getByRole("button", { name: /Dossiers de Remboursement/ }));
    await waitFor(() => expect(getDossiers).toHaveBeenCalledWith(0, 15, undefined));
    await waitFor(() => expect(screen.getByText("#CONS-0088")).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: /Envoyer/ }));
    await waitFor(() => expect(updateDossierStatut).toHaveBeenCalledWith(12, "ENVOYE"));

    await userEvent.click(screen.getByRole("button", { name: /Envoy/ }));
    await waitFor(() => expect(getDossiers).toHaveBeenCalledWith(0, 15, "ENVOYE"));
  });

  it("should create a reimbursement dossier after loading patient mutuelle and consultations", async () => {
    render(<MutualsPage />);

    await userEvent.click(screen.getByRole("button", { name: /Dossiers de Remboursement/ }));
    await waitFor(() => expect(screen.getByText("#CONS-0088")).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /Nouveau dossier/ }));
    await selectAlicePatient();
    await waitFor(() => expect(getMutuelleByPatient).toHaveBeenCalledWith(7));
    await waitFor(() => expect(getPatientConsultations).toHaveBeenCalledWith(7, 0, 50));
    await userEvent.selectOptions(screen.getByRole("combobox"), "88");
    await userEvent.click(screen.getByRole("button", { name: /Cr/ }));

    await waitFor(() => expect(createDossier).toHaveBeenCalledWith({
      patientId: 7,
      mutuelleId: 3,
      consultationId: 88,
    }));
  });
});
