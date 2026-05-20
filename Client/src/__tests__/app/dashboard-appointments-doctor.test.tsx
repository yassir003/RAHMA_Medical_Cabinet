import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppointmentsPage from "@/app/dashboard/appointments/page";
import DoctorWorkspacePage from "@/app/dashboard/doctors/page";
import PatientAppointmentsPage from "@/app/dashboard/patient/appointments/page";
import { useAuth } from "@/context/AuthContext";
import {
  cancelMyRendezVous,
  createConsultation,
  createRendezVous,
  deleteRendezVous,
  getConsultationsByMedecin,
  getDisponibilites,
  getMedecinMe,
  getMedecins,
  getMyProfile,
  getMyRdvsAsMedecin,
  getMyRendezVous,
  getPatients,
  getRendezVousAll,
  updateRendezVousFull,
  updateRendezVousStatut,
} from "@/lib/api";

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {},
  getRendezVousAll: jest.fn(),
  getMyRdvsAsMedecin: jest.fn(),
  createRendezVous: jest.fn(),
  updateRendezVousFull: jest.fn(),
  updateRendezVousStatut: jest.fn(),
  deleteRendezVous: jest.fn(),
  getPatients: jest.fn(),
  getMedecins: jest.fn(),
  getMedecinMe: jest.fn(),
  getConsultationsByMedecin: jest.fn(),
  createConsultation: jest.fn(),
  getMyRendezVous: jest.fn(),
  getMyProfile: jest.fn(),
  cancelMyRendezVous: jest.fn(),
  getDisponibilites: jest.fn(),
}));

const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const patient = {
  id: 7,
  nom: "Doe",
  prenom: "Alice",
  cin: "AB123456",
  email: "alice@mail.com",
  telephone: "0600000000",
};

const doctor = {
  id: 4,
  nom: "House",
  prenom: "Gregory",
  specialite: "Cardiology",
  email: "doctor@mail.com",
  telephone: "0700000000",
};

const appointment = {
  id: 30,
  patientId: 7,
  patientNom: "Doe",
  patientPrenom: "Alice",
  medecinId: 4,
  medecinNom: "House",
  medecinPrenom: "Gregory",
  medecinSpecialite: "Cardiology",
  dateHeure: `${today}T09:00:00`,
  motif: "Annual exam",
  notes: "Bring reports",
  statut: "PLANIFIE",
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
  dateVisite: `${today}T10:00:00`,
  motif: "Annual exam",
  diagnostic: "Stable",
  actesRealises: "ECG",
  notes: "Follow-up",
  montantTotal: 300,
};

beforeEach(() => {
  jest.clearAllMocks();
  (useAuth as jest.Mock).mockReturnValue({ user: { email: "admin@mail.com", role: "ADMIN" } });
  (getPatients as jest.Mock).mockResolvedValue({ content: [patient], totalElements: 1, totalPages: 1 });
  (getMedecins as jest.Mock).mockResolvedValue({ content: [doctor], totalElements: 1, totalPages: 1 });
  (getRendezVousAll as jest.Mock).mockResolvedValue({ content: [appointment], totalElements: 1, totalPages: 1 });
  (getMyRdvsAsMedecin as jest.Mock).mockResolvedValue({ content: [appointment], totalElements: 1, totalPages: 1 });
  (createRendezVous as jest.Mock).mockResolvedValue({ ...appointment, id: 31 });
  (updateRendezVousFull as jest.Mock).mockResolvedValue({ ...appointment, motif: "Updated exam" });
  (updateRendezVousStatut as jest.Mock).mockResolvedValue({ ...appointment, statut: "CONFIRME" });
  (deleteRendezVous as jest.Mock).mockResolvedValue(undefined);
  (getMedecinMe as jest.Mock).mockResolvedValue(doctor);
  (getConsultationsByMedecin as jest.Mock).mockResolvedValue({ content: [consultation], totalElements: 1, totalPages: 1 });
  (createConsultation as jest.Mock).mockResolvedValue(consultation);
  (getMyRendezVous as jest.Mock).mockResolvedValue({ content: [appointment], totalElements: 1, totalPages: 1 });
  (getMyProfile as jest.Mock).mockResolvedValue(patient);
  (cancelMyRendezVous as jest.Mock).mockResolvedValue({ ...appointment, statut: "ANNULE" });
  (getDisponibilites as jest.Mock).mockResolvedValue(["09:00", "10:00"]);
});

describe("dashboard appointment and doctor pages", () => {
  it("should render admin appointments and update appointment status", async () => {
    render(<AppointmentsPage />);

    await waitFor(() => expect(screen.getByText("Gestion des Rendez-vous")).toBeInTheDocument());
    await waitFor(() => expect(screen.getAllByText("Alice Doe").length).toBeGreaterThan(0));

    await userEvent.click(screen.getAllByRole("button", { name: /Confirmer/ })[0]);

    await waitFor(() => expect(updateRendezVousStatut).toHaveBeenCalledWith(30, "CONFIRME"));
  });

  it("should create appointment from admin calendar modal", async () => {
    render(<AppointmentsPage />);

    await waitFor(() => expect(screen.getByText("Gestion des Rendez-vous")).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /Nouveau RDV/ }));
    await userEvent.type(screen.getByPlaceholderText(/Rechercher par nom/), "Alice");
    await waitFor(() => expect(screen.getByRole("button", { name: /Alice Doe/ })).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /Alice Doe/ }));
    await userEvent.selectOptions(screen.getByRole("combobox"), "4");
    await userEvent.type(screen.getByPlaceholderText(/Raison de la consultation/), "Follow-up visit");
    await userEvent.click(screen.getByRole("button", { name: /Enregistrer/ }));

    await waitFor(() => expect(createRendezVous).toHaveBeenCalledWith(expect.objectContaining({
      patientId: 7,
      medecinId: 4,
      dateHeure: `${today}T09:00:00`,
      motif: "Follow-up visit",
    })));
  });

  it("should edit and delete appointment from admin page", async () => {
    render(<AppointmentsPage />);

    await waitFor(() => expect(screen.getAllByText("Alice Doe").length).toBeGreaterThan(0));
    await userEvent.click(screen.getAllByRole("button", { name: /Modifier/ })[0]);
    await userEvent.clear(screen.getByPlaceholderText(/Raison de la consultation/));
    await userEvent.type(screen.getByPlaceholderText(/Raison de la consultation/), "Updated exam");
    await userEvent.click(screen.getByRole("button", { name: /Enregistrer/ }));

    await waitFor(() => expect(updateRendezVousFull).toHaveBeenCalledWith(30, expect.objectContaining({
      motif: "Updated exam",
    })));

    expect(updateRendezVousFull).toHaveBeenCalled();
  });

  it("should render doctor workspace and navigate from consultation row", async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { email: "doctor@mail.com", role: "MEDECIN" } });

    const { container } = render(<DoctorWorkspacePage />);

    await waitFor(() => expect(screen.getByText(/Espace/)).toBeInTheDocument());
    expect(screen.getByText(/Dr. Gregory House/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: /Mes patients \(1\)/ })).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: /Mes patients \(1\)/ }));
    await userEvent.click(await screen.findByRole("button", { name: /Alice Doe/ }));

    expect(mockPush).toHaveBeenCalledWith("/dashboard/doctors/patients/7");
  });

  it("should redirect admin users away from doctor workspace", async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { email: "admin@mail.com", role: "ADMIN" } });

    render(<DoctorWorkspacePage />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/dashboard/doctors/list"));
  });

  it("should create consultation from doctor modal", async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { email: "doctor@mail.com", role: "MEDECIN" } });

    const { container } = render(<DoctorWorkspacePage />);

    await waitFor(() => expect(screen.getByRole("button", { name: /Nouvelle Consultation/ })).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /Nouvelle Consultation/ }));
    await userEvent.type(screen.getByPlaceholderText(/Rechercher un patient/), "Alice");
    await waitFor(() => expect(getPatients).toHaveBeenCalledWith(0, 8, "Alice"), { timeout: 2000 });
    const aliceOption = (await screen.findAllByRole("button", { name: /Alice Doe/ })).at(-1)!;
    await userEvent.click(aliceOption);
    await waitFor(() => expect(screen.getAllByText("Alice Doe").length).toBeGreaterThan(0));
    const visitDateInput = container.querySelector('input[type="datetime-local"]')!;
    fireEvent.change(visitDateInput, {
      target: { value: `${today}T12:00` },
    });
    expect(visitDateInput).toHaveValue(`${today}T12:00`);
    fireEvent.change(screen.getByPlaceholderText("Motif de consultation"), {
      target: { value: "Control visit" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Diagnostic/), {
      target: { value: "Everything looks stable" },
    });
    const submitButton = screen.getByRole("button", { name: /Créer la consultation/ });
    await waitFor(() => expect(submitButton).not.toBeDisabled());
    await userEvent.click(submitButton);

    await waitFor(() => expect(createConsultation).toHaveBeenCalledWith(expect.objectContaining({
      patientId: 7,
      medecinId: 4,
      dateVisite: `${today}T12:00`,
      motif: "Control visit",
      diagnostic: "Everything looks stable",
    })));
  });

  it("should update doctor rendez-vous from rendez-vous tab", async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { email: "doctor@mail.com", role: "MEDECIN" } });

    render(<DoctorWorkspacePage />);

    await waitFor(() => expect(screen.getByText(/Rendez-vous/)).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /Rendez-vous/ }));
    await userEvent.click(screen.getAllByRole("button", { name: /Confirmer/ })[0]);

    await waitFor(() => expect(updateRendezVousStatut).toHaveBeenCalledWith(30, "CONFIRME"));
  });

  it("should finish confirmed doctor rendez-vous from rendez-vous tab", async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { email: "doctor@mail.com", role: "MEDECIN" } });
    (getMyRdvsAsMedecin as jest.Mock).mockResolvedValueOnce({
      content: [{ ...appointment, statut: "CONFIRME" }],
      totalElements: 1,
      totalPages: 1,
    });
    (updateRendezVousStatut as jest.Mock).mockResolvedValueOnce({ ...appointment, statut: "TERMINE" });

    render(<DoctorWorkspacePage />);

    await waitFor(() => expect(screen.getByText(/Rendez-vous/)).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /Rendez-vous/ }));
    await userEvent.click(await screen.findByRole("button", { name: /Terminer/ }));

    await waitFor(() => expect(updateRendezVousStatut).toHaveBeenCalledWith(30, "TERMINE"));
  });

  it("should create consultation from planification appointment shortcut", async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { email: "doctor@mail.com", role: "MEDECIN" } });

    render(<DoctorWorkspacePage />);

    await waitFor(() => expect(screen.getByText(/Planification/)).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /Planification/ }));
    await userEvent.click(await screen.findByRole("button", { name: /Créer consultation/ }));
    await userEvent.type(screen.getByPlaceholderText(/Diagnostic/), "Stable after appointment");
    await userEvent.click(screen.getByRole("button", { name: /Créer la consultation/ }));

    await waitFor(() => expect(createConsultation).toHaveBeenCalledWith(expect.objectContaining({
      patientId: 7,
      medecinId: 4,
      dateVisite: `${today}T09:00`,
      motif: "Annual exam",
      notes: "Bring reports",
      diagnostic: "Stable after appointment",
    })));
  });

  it("should cancel patient appointment from patient appointment list", async () => {
    render(<PatientAppointmentsPage />);

    await waitFor(() => expect(screen.getAllByText("Mes rendez-vous").length).toBeGreaterThan(0));
    await waitFor(() => expect(screen.getByText(/Gregory\s+House/)).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: /Annuler/ }));
    await userEvent.click(screen.getByRole("button", { name: /Confirmer l'annulation/ }));

    await waitFor(() => expect(cancelMyRendezVous).toHaveBeenCalledWith(30));
  });

  it("should book patient appointment from booking wizard", async () => {
    render(<PatientAppointmentsPage />);

    await waitFor(() => expect(screen.getAllByText("Mes rendez-vous").length).toBeGreaterThan(0));
    await userEvent.click(screen.getByRole("button", { name: /Prendre un rendez-vous/ }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Dr. Gregory House/ })).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /Dr. Gregory House/ }));
    await userEvent.click(screen.getByRole("button", { name: "Suivant" }));
    await waitFor(() => expect(getDisponibilites).toHaveBeenCalledWith(4, expect.any(String)));
    await userEvent.click(screen.getByRole("button", { name: /09:00/ }));
    await userEvent.click(screen.getByRole("button", { name: "Suivant" }));
    await userEvent.type(screen.getByPlaceholderText(/raison de votre visite/), "Routine check");
    await userEvent.click(screen.getByRole("button", { name: /Confirmer le rendez-vous/ }));

    await waitFor(() => expect(createRendezVous).toHaveBeenCalledWith(expect.objectContaining({
      patientId: 7,
      medecinId: 4,
      motif: "Routine check",
    })));
  });
});
