import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LandingPage from "@/app/page";
import AboutPage from "@/app/about/page";
import ContactPage from "@/app/contact/page";
import DoctorsPage from "@/app/doctors/page";
import ServicesPage from "@/app/services/page";
import { useAuth } from "@/context/AuthContext";
import { createRendezVous, getMedecins, getMyProfile } from "@/lib/api";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt, src, fill: _fill, priority: _priority, ...props }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} {...props} />
  ),
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
  defaultRouteForRole: (role: string) => `/dashboard/${role.toLowerCase()}`,
}));

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

jest.mock("@/lib/api", () => ({
  getMedecins: jest.fn(),
  createRendezVous: jest.fn(),
  getMyProfile: jest.fn(),
}));

const doctor = {
  id: 1,
  nom: "House",
  prenom: "Gregory",
  specialite: "Cardiology",
  telephone: "0700000000",
  email: "doctor@mail.com",
};

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  (useAuth as jest.Mock).mockReturnValue({ user: null });
  (getMedecins as jest.Mock).mockResolvedValue({
    content: [doctor],
    totalPages: 1,
    totalElements: 1,
  });
});

describe("public pages", () => {
  it("should render landing page and display loaded doctor content", async () => {
    render(<LandingPage />);

    expect(screen.getByText(/Your Health, Our Priority/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Gregory House/i)).toBeInTheDocument());
    expect(getMedecins).toHaveBeenCalledWith(0, 4);
  });

  it("should show empty specialist state on landing page when no doctors are available", async () => {
    (getMedecins as jest.Mock).mockResolvedValueOnce({
      content: [],
      totalPages: 0,
      totalElements: 0,
    });

    render(<LandingPage />);

    await waitFor(() => expect(screen.getByText("No specialists available at the moment.")).toBeInTheDocument());
  });

  it("should expand and collapse a landing page FAQ answer", async () => {
    render(<LandingPage />);

    await userEvent.click(screen.getByRole("button", { name: /Why choose our medical for your family/i }));

    expect(screen.getByText(/comprehensive care/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Why choose our medical for your family/i }));

    expect(screen.queryByText(/comprehensive care/i)).not.toBeInTheDocument();
  });

  it("should show dashboard entry when public page receives authenticated user", () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { email: "admin@mail.com", role: "ADMIN" },
    });

    render(<AboutPage />);

    expect(screen.getByText("Mon Espace")).toBeInTheDocument();
    expect(screen.getByText("ADMIN")).toBeInTheDocument();
  });

  it("should render services page with key service cards", () => {
    render(<ServicesPage />);

    expect(screen.getByText("Dentistry")).toBeInTheDocument();
    expect(screen.getByText("Cardiology")).toBeInTheDocument();
    expect(screen.getByText("MRI & Imaging")).toBeInTheDocument();
  });

  it("should render contact form fields when contact page opens", () => {
    render(<ContactPage />);

    expect(screen.getByPlaceholderText("First Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Last Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email Address")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Write your message...")).toBeInTheDocument();
  });

  it("should search doctors when search form is submitted", async () => {
    render(<DoctorsPage />);

    await waitFor(() => expect(screen.getByText("Dr. Gregory House")).toBeInTheDocument());
    await userEvent.type(screen.getByPlaceholderText("Dr. Doctor, Specialty"), "cardio");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => expect(getMedecins).toHaveBeenLastCalledWith(0, 10, "cardio"));
  });

  it("should store pending appointment and redirect when anonymous user picks a time slot", async () => {
    render(<DoctorsPage />);

    await waitFor(() => expect(screen.getByText("Dr. Gregory House")).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: "Book Clinic Visit" }));
    await userEvent.click(screen.getAllByRole("button", { name: "09:00 AM" })[0]);

    expect(JSON.parse(localStorage.getItem("pending_rendezvous") ?? "{}")).toMatchObject({ doctorId: 1 });
    expect(push).toHaveBeenCalledWith("/register");
  });

  it("should create appointment when logged-in patient picks a time slot", async () => {
    localStorage.setItem("rahma_auth_user", JSON.stringify({ token: "abc" }));
    (getMyProfile as jest.Mock).mockResolvedValue({ id: 9 });
    (createRendezVous as jest.Mock).mockResolvedValue({});
    window.alert = jest.fn();

    render(<DoctorsPage />);

    await waitFor(() => expect(screen.getByText("Dr. Gregory House")).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: "Book Clinic Visit" }));
    await userEvent.click(screen.getAllByRole("button", { name: "09:00 AM" })[0]);

    await waitFor(() => expect(createRendezVous).toHaveBeenCalledWith(expect.objectContaining({
      patientId: 9,
      medecinId: 1,
    })));
    expect(window.alert).toHaveBeenCalledWith("Rendez-vous réservé avec succès !");
  });
});
