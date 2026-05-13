import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardPage from "@/app/dashboard/page";
import DashboardLayout from "@/app/dashboard/layout";
import PatientHomePage from "@/app/dashboard/patient/page";
import PatientNotificationsPage from "@/app/dashboard/patient/notifications/page";
import { useAuth } from "@/context/AuthContext";
import {
  createRendezVous,
  getDashboardStats,
  getMyNotifications,
  getMyProfile,
  getMyRendezVous,
  getPatients,
  getRendezVousAll,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  updateMyProfile,
} from "@/lib/api";

const mockReplace = jest.fn();
let mockPathname = "/dashboard";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => mockPathname,
}));

jest.mock("@/components/ProtectedRoute", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/components/Logo", () => ({
  Logo: () => <div>RAHMA</div>,
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
  defaultRouteForRole: (role: string) => `/dashboard/${role.toLowerCase()}`,
}));

jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-chart">{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
}));

jest.mock("@/lib/api", () => ({
  getDashboardStats: jest.fn(),
  getPatients: jest.fn(),
  getRendezVousAll: jest.fn(),
  getUnreadCount: jest.fn(),
  getMyProfile: jest.fn(),
  getMyRendezVous: jest.fn(),
  getMyNotifications: jest.fn(),
  updateMyProfile: jest.fn(),
  createRendezVous: jest.fn(),
  markNotificationRead: jest.fn(),
  markAllNotificationsRead: jest.fn(),
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
  allergies: "None",
  antecedents: "Asthma",
  dateNaissance: "1990-01-01",
};

const appointment = {
  id: 11,
  patientId: 7,
  patientNom: "Doe",
  patientPrenom: "Alice",
  medecinId: 4,
  medecinNom: "House",
  medecinPrenom: "Gregory",
  dateHeure: "2099-06-10T09:00:00",
  motif: "Checkup",
  statut: "PLANIFIE",
};

const notification = {
  id: 21,
  titre: "Rdv demain",
  message: "Votre rendez-vous est confirmé",
  type: "RDV_CONFIRME",
  lu: false,
  dateCreation: new Date().toISOString(),
};

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockPathname = "/dashboard";
  window.alert = jest.fn();

  (useAuth as jest.Mock).mockReturnValue({
    user: {
      email: "admin@mail.com",
      role: "ADMIN",
      pages: [
        { name: "Dashboard", path: "/dashboard" },
        { name: "Patient", path: "/dashboard/patients" },
      ],
    },
    logout: jest.fn(),
  });

  (getDashboardStats as jest.Mock).mockResolvedValue({
    totalPatients: 42,
    totalMedecins: 6,
    rdvAujourdhui: 3,
    totalConsultations: 14,
    rendezVousParMois: { "6": { PLANIFIE: 2, TERMINE: 1 } },
  });
  (getPatients as jest.Mock).mockResolvedValue({ content: [patient], totalElements: 1, totalPages: 1 });
  (getRendezVousAll as jest.Mock).mockResolvedValue({ content: [appointment], totalElements: 1, totalPages: 1 });
  (getUnreadCount as jest.Mock).mockResolvedValue(1);
  (getMyProfile as jest.Mock).mockResolvedValue(patient);
  (getMyRendezVous as jest.Mock).mockResolvedValue({ content: [appointment], totalElements: 1, totalPages: 1 });
  (getMyNotifications as jest.Mock).mockResolvedValue({ content: [notification], totalElements: 1, totalPages: 1 });
  (updateMyProfile as jest.Mock).mockResolvedValue({ ...patient, telephone: "0611111111" });
  (createRendezVous as jest.Mock).mockResolvedValue(appointment);
  (markNotificationRead as jest.Mock).mockResolvedValue({ ...notification, lu: true });
  (markAllNotificationsRead as jest.Mock).mockResolvedValue(undefined);
});

describe("dashboard pages", () => {
  it("should render admin dashboard metrics when API data is loaded", async () => {
    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByText("Total Patients")).toBeInTheDocument());

    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Alice Doe")).toBeInTheDocument();
    expect(screen.getByText(/Checkup - Alice Doe/)).toBeInTheDocument();
    expect(getDashboardStats).toHaveBeenCalled();
  });

  it("should redirect non-admin users when they open the admin dashboard", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { email: "patient@mail.com", role: "PATIENT", pages: [] },
      logout: jest.fn(),
    });

    render(<DashboardPage />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/dashboard/patient"));
    expect(getDashboardStats).not.toHaveBeenCalled();
  });

  it("should render dashboard layout with patient unread badge and logout action", async () => {
    const logout = jest.fn();
    mockPathname = "/dashboard/patient/notifications";
    (getUnreadCount as jest.Mock).mockResolvedValue(12);
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        email: "patient@mail.com",
        role: "PATIENT",
        pages: [
          { name: "Accueil", path: "/dashboard/patient" },
          { name: "Notifications", path: "/dashboard/patient/notifications" },
        ],
      },
      logout,
    });

    render(
      <DashboardLayout>
        <main>Patient workspace</main>
      </DashboardLayout>
    );

    expect(screen.getByText("Patient workspace")).toBeInTheDocument();
    expect(screen.getByText("patient@mail.com")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("9+")).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: /Logout/i }));

    expect(logout).toHaveBeenCalled();
  });

  it("should render patient home data and save profile edits", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { email: "alice@mail.com", role: "PATIENT", pages: [] },
      logout: jest.fn(),
    });

    render(<PatientHomePage />);

    await waitFor(() => expect(screen.getByText("Alice Doe")).toBeInTheDocument());
    expect(screen.getByText("Dr. Gregory House")).toBeInTheDocument();
    expect(screen.getByText("Rdv demain")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Modifier mon profil/ }));
    await userEvent.clear(screen.getByPlaceholderText("+212 6xx xxx xxx"));
    await userEvent.type(screen.getByPlaceholderText("+212 6xx xxx xxx"), "0611111111");
    await userEvent.click(screen.getByRole("button", { name: /Enregistrer/ }));

    await waitFor(() => expect(updateMyProfile).toHaveBeenCalledWith(expect.objectContaining({
      telephone: "0611111111",
    })));
  });

  it("should create pending patient appointment after registration", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { email: "alice@mail.com", role: "PATIENT", pages: [] },
      logout: jest.fn(),
    });
    localStorage.setItem("pending_rendezvous", JSON.stringify({
      doctorId: 4,
      dateTime: "2099-06-10T09:00:00",
    }));

    render(<PatientHomePage />);

    await waitFor(() => expect(createRendezVous).toHaveBeenCalledWith({
      patientId: 7,
      medecinId: 4,
      dateHeure: "2099-06-10T09:00:00",
      motif: "Consultation",
    }));
    expect(localStorage.getItem("pending_rendezvous")).toBeNull();
  });

  it("should mark patient notifications as read when the unread item is selected", async () => {
    render(<PatientNotificationsPage />);

    await waitFor(() => expect(screen.getByText("Rdv demain")).toBeInTheDocument());

    await userEvent.click(screen.getByText("Rdv demain"));

    await waitFor(() => expect(markNotificationRead).toHaveBeenCalledWith(21));
  });

  it("should filter unread notifications and mark all notifications as read", async () => {
    (getMyNotifications as jest.Mock).mockResolvedValue({
      content: [
        notification,
        { ...notification, id: 22, titre: "Message archivé", lu: true },
      ],
      totalElements: 2,
      totalPages: 1,
    });

    render(<PatientNotificationsPage />);

    await waitFor(() => expect(screen.getByText("Rdv demain")).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /Non lues/ }));

    expect(screen.getByText("Rdv demain")).toBeInTheDocument();
    expect(screen.queryByText("Message archivé")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Tout marquer comme lu/ }));

    await waitFor(() => expect(markAllNotificationsRead).toHaveBeenCalled());
  });
});
