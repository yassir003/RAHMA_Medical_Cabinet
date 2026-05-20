import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PatientsPage from "@/app/dashboard/patients/page";
import SecretaryWorkspacePage from "@/app/dashboard/secretary/page";
import {
  ApiError,
  chatAi,
  createPatient,
  deletePatient,
  getDossiers,
  getPatients,
  getRendezVousAll,
  updatePatient,
  updateRendezVousStatut,
} from "@/lib/api";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {},
  getPatients: jest.fn(),
  createPatient: jest.fn(),
  updatePatient: jest.fn(),
  deletePatient: jest.fn(),
  getRendezVousAll: jest.fn(),
  getDossiers: jest.fn(),
  updateRendezVousStatut: jest.fn(),
  chatAi: jest.fn(),
}));

const patient = {
  id: 7,
  nom: "Doe",
  prenom: "Alice",
  cin: "AB123456",
  email: "alice@mail.com",
  telephone: "0600000000",
  adresse: "Casablanca",
  groupeSanguin: "O+",
  allergies: "Pollen",
  antecedents: "Asthma",
  dateNaissance: "1990-01-01",
};

const todayAppointment = {
  id: 30,
  patientId: 7,
  patientNom: "Doe",
  patientPrenom: "Alice",
  medecinId: 4,
  medecinNom: "House",
  medecinPrenom: "Gregory",
  dateHeure: new Date().toISOString(),
  motif: "Consultation",
  statut: "PLANIFIE",
};

const dossier = {
  id: 44,
  patientNom: "Doe",
  patientPrenom: "Alice",
  consultationId: 88,
  mutuelleOrganisme: "CNSS Maroc",
  statut: "EN_ATTENTE",
  dateCreation: new Date().toISOString(),
};

beforeEach(() => {
  jest.clearAllMocks();
  Element.prototype.scrollIntoView = jest.fn();
  (getPatients as jest.Mock).mockResolvedValue({ content: [patient], totalElements: 1, totalPages: 1 });
  (createPatient as jest.Mock).mockResolvedValue({ ...patient, id: 8, nom: "Smith", prenom: "Sara", cin: "BE123456" });
  (updatePatient as jest.Mock).mockResolvedValue({ ...patient, telephone: "0611111111" });
  (deletePatient as jest.Mock).mockResolvedValue(undefined);
  (getRendezVousAll as jest.Mock).mockResolvedValue({ content: [todayAppointment], totalElements: 1, totalPages: 1 });
  (getDossiers as jest.Mock).mockResolvedValue({ content: [dossier], totalElements: 1, totalPages: 1 });
  (updateRendezVousStatut as jest.Mock).mockResolvedValue({ ...todayAppointment, statut: "CONFIRME" });
  (chatAi as jest.Mock).mockResolvedValue("Voici une réponse de test.");
});

describe("dashboard admin workflows", () => {
  it("should render patients list and open patient details", async () => {
    render(<PatientsPage />);

    await waitFor(() => expect(screen.getByText("Gestion des Patients")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("Alice Doe")).toBeInTheDocument());

    await userEvent.click(screen.getByTitle("Voir le dossier"));

    expect(screen.getByText("CIN: AB123456")).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole("button", { name: /Dossier/ }).at(-1)!);

    expect(mockPush).toHaveBeenCalledWith("/dashboard/doctors/patients/7");
  });

  it("should create edit and delete patients from patient management page", async () => {
    render(<PatientsPage />);

    await waitFor(() => expect(screen.getByText("Alice Doe")).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: /Nouveau patient/ }));
    await userEvent.type(screen.getByPlaceholderText("Ex: Alaoui"), "Smith");
    await userEvent.type(screen.getByPlaceholderText("Ex: Youssef"), "Sara");
    await userEvent.type(screen.getByPlaceholderText("Ex: BE123456"), "BE123456");
    await userEvent.click(screen.getByRole("button", { name: /Enregistrer/ }));

    await waitFor(() => expect(createPatient).toHaveBeenCalledWith(expect.objectContaining({
      nom: "Smith",
      prenom: "Sara",
      cin: "BE123456",
    })));

    await userEvent.click(screen.getAllByTitle("Modifier").at(-1)!);
    await userEvent.clear(screen.getByPlaceholderText("+212 6xx xxx xxx"));
    await userEvent.type(screen.getByPlaceholderText("+212 6xx xxx xxx"), "0611111111");
    await userEvent.click(screen.getByRole("button", { name: /Enregistrer/ }));

    await waitFor(() => expect(updatePatient).toHaveBeenCalledWith(7, expect.objectContaining({
      telephone: "0611111111",
    })));

    await userEvent.click(screen.getAllByTitle("Supprimer").at(-1)!);
    await userEvent.click(screen.getAllByRole("button", { name: /^Supprimer$/ }).at(-1)!);

    await waitFor(() => expect(deletePatient).toHaveBeenCalledWith(7));
  });

  it("should show validation error when patient creation is submitted without identity fields", async () => {
    render(<PatientsPage />);

    await waitFor(() => expect(screen.getByText("Alice Doe")).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /Nouveau patient/ }));
    await userEvent.click(screen.getByRole("button", { name: /Enregistrer/ }));

    expect(createPatient).not.toHaveBeenCalled();
    expect(await screen.findByText(/Nom, pr.*nom et CIN sont requis/i)).toBeInTheDocument();
  });

  it("should display API errors while creating a patient", async () => {
    (createPatient as jest.Mock).mockRejectedValueOnce(new ApiError("CIN deja utilise"));

    render(<PatientsPage />);

    await waitFor(() => expect(screen.getByText("Alice Doe")).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /Nouveau patient/ }));
    await userEvent.type(screen.getByPlaceholderText("Ex: Alaoui"), "Smith");
    await userEvent.type(screen.getByPlaceholderText("Ex: Youssef"), "Sara");
    await userEvent.type(screen.getByPlaceholderText("Ex: BE123456"), "BE123456");
    await userEvent.click(screen.getByRole("button", { name: /Enregistrer/ }));

    expect(await screen.findByText("CIN deja utilise")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Nouveau patient" })).toBeInTheDocument();
  });

  it("should load the next patients page from pagination controls", async () => {
    (getPatients as jest.Mock).mockResolvedValue({
      content: [patient],
      totalElements: 13,
      totalPages: 2,
    });

    render(<PatientsPage />);

    await waitFor(() => expect(screen.getByText(/Page 1 sur 2.*13 patients/)).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /Suivant/ }));

    await waitFor(() => expect(getPatients).toHaveBeenCalledWith(1, 12, ""));
    expect(screen.getByText(/Page 2 sur 2.*13 patients/)).toBeInTheDocument();
  });

  it("should search patients and show empty state when no result is returned", async () => {
    (getPatients as jest.Mock).mockImplementation((_page: number, _size: number, query: string) =>
      Promise.resolve(query
        ? { content: [], totalElements: 0, totalPages: 1 }
        : { content: [patient], totalElements: 1, totalPages: 1 }),
    );

    render(<PatientsPage />);

    await waitFor(() => expect(screen.getByText("Alice Doe")).toBeInTheDocument());
    await userEvent.type(screen.getByPlaceholderText(/Rechercher par nom/), "Nobody");

    await waitFor(() => expect(getPatients).toHaveBeenCalledWith(0, 12, "Nobody"));
    expect(screen.getByText(/Aucun/)).toBeInTheDocument();
  });

  it("should render secretary workspace and update today appointment status", async () => {
    render(<SecretaryWorkspacePage />);

    await waitFor(() => expect(screen.getByText(/Espace/)).toBeInTheDocument());
    expect(screen.getAllByText("Alice Doe").length).toBeGreaterThan(0);
    expect(screen.getByText("Alertes Mutuelles")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Agenda/ }));
    expect(mockPush).toHaveBeenCalledWith("/dashboard/appointments");

    await userEvent.click(screen.getByRole("button", { name: /Confirmer/ }));

    await waitFor(() => expect(updateRendezVousStatut).toHaveBeenCalledWith(30, "CONFIRME"));
  });

  it("should send a secretary AI chat message", async () => {
    render(<SecretaryWorkspacePage />);

    await waitFor(() => expect(screen.getByText(/Espace/)).toBeInTheDocument());
    await userEvent.click(screen.getByText("Assistant IA"));
    await userEvent.type(screen.getByPlaceholderText(/Posez votre question/), "Quels RDV aujourd'hui ?{enter}");

    await waitFor(() => expect(chatAi).toHaveBeenCalledWith("Quels RDV aujourd'hui ?"));
    expect(await screen.findByText("Voici une réponse de test.")).toBeInTheDocument();
  });
});
