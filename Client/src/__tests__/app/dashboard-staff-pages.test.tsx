import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateDoctorPage from "@/app/dashboard/doctors/create/page";
import DoctorsListPage from "@/app/dashboard/doctors/list/page";
import CreateSecretaryPage from "@/app/dashboard/secretary/create/page";
import SecretaryListPage from "@/app/dashboard/secretary/list/page";
import { useAuth } from "@/context/AuthContext";
import {
  ApiError,
  createMedecin,
  createSecretaire,
  deleteMedecin,
  deleteSecretaire,
  getMedecins,
  getSecretaires,
  updateMedecin,
  updateSecretaire,
} from "@/lib/api";

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {},
  createMedecin: jest.fn(),
  getMedecins: jest.fn(),
  updateMedecin: jest.fn(),
  deleteMedecin: jest.fn(),
  createSecretaire: jest.fn(),
  getSecretaires: jest.fn(),
  updateSecretaire: jest.fn(),
  deleteSecretaire: jest.fn(),
}));

const doctor = {
  id: 4,
  nom: "House",
  prenom: "Gregory",
  specialite: "Cardiologue",
  email: "doctor@mail.com",
  telephone: "0700000000",
};

const secretary = {
  id: 9,
  nom: "Martin",
  prenom: "Claire",
  email: "claire@mail.com",
  telephone: "0611111111",
  assignedDoctor: "Dr. House",
};

beforeEach(() => {
  jest.clearAllMocks();
  (useAuth as jest.Mock).mockReturnValue({ user: { role: "ADMIN" } });
  (createMedecin as jest.Mock).mockResolvedValue(doctor);
  (getMedecins as jest.Mock).mockResolvedValue({ content: [doctor], totalElements: 1, totalPages: 1 });
  (updateMedecin as jest.Mock).mockResolvedValue({ ...doctor, telephone: "0711111111" });
  (deleteMedecin as jest.Mock).mockResolvedValue(undefined);
  (createSecretaire as jest.Mock).mockResolvedValue(secretary);
  (getSecretaires as jest.Mock).mockResolvedValue({ content: [secretary], totalElements: 1, totalPages: 1 });
  (updateSecretaire as jest.Mock).mockResolvedValue({ ...secretary, telephone: "0622222222" });
  (deleteSecretaire as jest.Mock).mockResolvedValue(undefined);
  jest.spyOn(window, "alert").mockImplementation(() => undefined);
  jest.spyOn(window, "confirm").mockReturnValue(true);
});

afterEach(() => {
  (window.alert as jest.Mock).mockRestore();
  (window.confirm as jest.Mock).mockRestore();
  jest.useRealTimers();
});

describe("dashboard staff pages", () => {
  it("should show doctor validation messages when required fields are empty", async () => {
    render(<CreateDoctorPage />);

    await userEvent.click(screen.getByRole("button", { name: /Enregistrer le/ }));

    expect(createMedecin).not.toHaveBeenCalled();
    expect(screen.getByText("Le nom est requis.")).toBeInTheDocument();
    expect(screen.getByText(/Email invalide|L'email est requis/)).toBeInTheDocument();
    expect(screen.getByText(/mot de passe est requis/i)).toBeInTheDocument();
  });

  it("should validate invalid doctor email and mismatched passwords", async () => {
    render(<CreateDoctorPage />);

    await userEvent.type(screen.getByPlaceholderText("Ex: Benali"), "House");
    await userEvent.type(screen.getByPlaceholderText("Ex: Ahmed"), "Gregory");
    await userEvent.type(screen.getByPlaceholderText("dr.benali@cabinet.com"), "doctor@mail");
    await userEvent.type(screen.getByPlaceholderText(/Minimum 8/), "password123");
    await userEvent.type(screen.getByPlaceholderText(/mot de passe/), "different123");
    await userEvent.click(screen.getByRole("button", { name: /Enregistrer le/ }));

    expect(createMedecin).not.toHaveBeenCalled();
    expect(screen.getByText("Email invalide.")).toBeInTheDocument();
    expect(screen.getByText("Les mots de passe ne correspondent pas.")).toBeInTheDocument();
  });

  it("should create a doctor and show success before redirecting", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<CreateDoctorPage />);

    await user.type(screen.getByPlaceholderText("Ex: Benali"), "House");
    await user.type(screen.getByPlaceholderText("Ex: Ahmed"), "Gregory");
    await user.selectOptions(screen.getByRole("combobox"), "Cardiologue");
    await user.type(screen.getByPlaceholderText("+212 6xx xxx xxx"), "0700000000");
    await user.type(screen.getByPlaceholderText("dr.benali@cabinet.com"), "doctor@mail.com");
    await user.type(screen.getByPlaceholderText(/Minimum 8/), "password123");
    await user.type(screen.getByPlaceholderText(/mot de passe/), "password123");
    await user.click(screen.getByRole("button", { name: /Enregistrer le/ }));

    await waitFor(() => expect(createMedecin).toHaveBeenCalledWith(expect.objectContaining({
      nom: "House",
      prenom: "Gregory",
      specialite: "Cardiologue",
      email: "doctor@mail.com",
      telephone: "0700000000",
      password: "password123",
    })));
    expect(await screen.findByText(/succ/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1800);
    });

    expect(mockPush).toHaveBeenCalledWith("/dashboard/doctors/list");
  });

  it("should display doctor creation API errors without redirecting", async () => {
    (createMedecin as jest.Mock).mockRejectedValueOnce(new ApiError("Email deja utilise"));
    render(<CreateDoctorPage />);

    await userEvent.type(screen.getByPlaceholderText("Ex: Benali"), "House");
    await userEvent.type(screen.getByPlaceholderText("Ex: Ahmed"), "Gregory");
    await userEvent.selectOptions(screen.getByRole("combobox"), "Cardiologue");
    await userEvent.type(screen.getByPlaceholderText("dr.benali@cabinet.com"), "doctor@mail.com");
    await userEvent.type(screen.getByPlaceholderText(/Minimum 8/), "password123");
    await userEvent.type(screen.getByPlaceholderText(/mot de passe/), "password123");
    await userEvent.click(screen.getByRole("button", { name: /Enregistrer le/ }));

    expect(await screen.findByText("Email deja utilise")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should edit and delete a doctor from the doctor list", async () => {
    render(<DoctorsListPage />);

    await waitFor(() => expect(screen.getByText("Dr. Gregory House")).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /Ajouter un/ }));
    expect(mockPush).toHaveBeenCalledWith("/dashboard/doctors/create");

    await userEvent.click(screen.getByRole("button", { name: /Modifier/ }));
    await userEvent.clear(screen.getByPlaceholderText("+212 6xx xxx xxx"));
    await userEvent.type(screen.getByPlaceholderText("+212 6xx xxx xxx"), "0711111111");
    await userEvent.click(screen.getAllByRole("button", { name: /^Enregistrer$/ }).at(-1)!);

    await waitFor(() => expect(updateMedecin).toHaveBeenCalledWith(4, expect.objectContaining({
      telephone: "0711111111",
    })));

    await userEvent.click(screen.getByRole("button", { name: /Supprimer/ }));
    await waitFor(() => expect(deleteMedecin).toHaveBeenCalledWith(4));
  });

  it("should render doctor list as read-only for non-admin users", async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { role: "MEDECIN" } });

    render(<DoctorsListPage />);

    await waitFor(() => expect(screen.getByText("Dr. Gregory House")).toBeInTheDocument());

    expect(screen.queryByRole("button", { name: /Ajouter un/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Modifier/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Supprimer/ })).not.toBeInTheDocument();
  });

  it("should show empty doctor state when no doctors are returned", async () => {
    (getMedecins as jest.Mock).mockResolvedValueOnce({ content: [], totalElements: 0, totalPages: 1 });

    render(<DoctorsListPage />);

    await waitFor(() => expect(screen.getByRole("heading", { name: /trouv/ })).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /premier/ }));

    expect(mockPush).toHaveBeenCalledWith("/dashboard/doctors/create");
  });

  it("should validate and create a secretary from the create form", async () => {
    const { container } = render(<CreateSecretaryPage />);

    fireEvent.submit(container.querySelector("form")!);
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("obligatoires"));

    await userEvent.type(screen.getByPlaceholderText("Entrez le nom"), "Martin");
    await userEvent.type(screen.getByPlaceholderText(/pr/), "Claire");
    await userEvent.type(screen.getByPlaceholderText("contact@secretaire.com"), "claire@mail.com");
    await userEvent.type(screen.getByPlaceholderText("+212 ..."), "0611111111");
    await userEvent.type(container.querySelector('input[type="password"]')!, "secret123");
    await userEvent.click(screen.getByRole("button", { name: /Enregistrer/ }));

    await waitFor(() => expect(createSecretaire).toHaveBeenCalledWith({
      nom: "Martin",
      prenom: "Claire",
      email: "claire@mail.com",
      telephone: "0611111111",
      password: "secret123",
    }));
    expect(mockBack).toHaveBeenCalled();
  });

  it("should view edit and delete a secretary from the secretary list", async () => {
    render(<SecretaryListPage />);

    await waitFor(() => expect(screen.getByText("Claire Martin")).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /Nouveau/ }));
    expect(mockPush).toHaveBeenCalledWith("/dashboard/secretary/create");

    await userEvent.click(screen.getByTitle("Voir informations"));
    expect(screen.getByText(/Informations du/)).toBeInTheDocument();
    expect(screen.getByText("ID: 9")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Fermer/ }));

    await userEvent.click(screen.getByTitle("Modifier"));
    await userEvent.clear(screen.getByPlaceholderText(/T/));
    await userEvent.type(screen.getByPlaceholderText(/T/), "0622222222");
    await userEvent.click(screen.getAllByRole("button", { name: /Enregistrer/ }).at(-1)!);

    await waitFor(() => expect(updateSecretaire).toHaveBeenCalledWith(9, expect.objectContaining({
      telephone: "0622222222",
    })));
    expect(updateSecretaire).toHaveBeenCalledWith(9, expect.not.objectContaining({
      password: expect.anything(),
    }));

    await userEvent.click(screen.getByTitle("Supprimer"));
    await waitFor(() => expect(deleteSecretaire).toHaveBeenCalledWith(9));
  });
});
