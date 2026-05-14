import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuditLogsPage from "@/app/dashboard/logs/page";
import { useAuth } from "@/context/AuthContext";
import { getAuditLogs } from "@/lib/api";

const mockReplace = jest.fn();

type Listener = (event: { data: string }) => void;

class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  listeners: Record<string, Listener[]> = {};
  onerror: (() => void) | null = null;
  close = jest.fn();

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: Listener) {
    this.listeners[type] = [...(this.listeners[type] || []), listener];
  }

  emit(type: string, data = "") {
    (this.listeners[type] || []).forEach((listener) => listener({ data }));
  }
}

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/lib/api", () => ({
  getAuditLogs: jest.fn(),
}));

const logs = [
  {
    id: 1,
    action: "LOGIN_SUCCESS",
    entite: "Utilisateur",
    entiteId: 7,
    utilisateur: "admin@mail.com",
    timestamp: "2026-05-14T09:00:00",
    details: "Connexion réussie",
  },
  {
    id: 2,
    action: "CREATE_PATIENT",
    entite: "Patient",
    entiteId: 8,
    utilisateur: "secretary@mail.com",
    timestamp: "2026-05-14T10:00:00",
    details: "Patient Alice créé",
  },
  {
    id: 3,
    action: "DELETE_RDV",
    entite: "RendezVous",
    entiteId: 9,
    utilisateur: "admin@mail.com",
    timestamp: "2026-05-14T11:00:00",
    details: "RDV supprimé",
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  MockEventSource.instances = [];
  localStorage.clear();
  localStorage.setItem("rahma_auth_user", JSON.stringify({ token: "audit-token" }));
  (global as any).EventSource = MockEventSource;
  (useAuth as jest.Mock).mockReturnValue({ user: { role: "ADMIN" } });
  (getAuditLogs as jest.Mock).mockResolvedValue({ content: logs, totalElements: 3, totalPages: 1 });
});

describe("dashboard audit logs page", () => {
  it("should render audit logs and filter by search text", async () => {
    render(<AuditLogsPage />);

    await waitFor(() => expect(getAuditLogs).toHaveBeenCalledWith(0, 200));
    expect(screen.getByText(/Journal d'audit/)).toBeInTheDocument();
    expect(await screen.findByText("LOGIN_SUCCESS")).toBeInTheDocument();
    expect(screen.getByText("CREATE_PATIENT")).toBeInTheDocument();
    expect(MockEventSource.instances[0].url).toContain("audit-token");

    await userEvent.type(screen.getByPlaceholderText(/Utilisateur/), "secretary");

    expect(screen.queryByText("LOGIN_SUCCESS")).not.toBeInTheDocument();
    expect(screen.getByText("CREATE_PATIENT")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Actualiser/ }));
    await waitFor(() => expect(getAuditLogs).toHaveBeenCalledTimes(2));
  });

  it("should filter logs by category buttons", async () => {
    render(<AuditLogsPage />);

    await waitFor(() => expect(screen.getByText("CREATE_PATIENT")).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /Suppressions/ }));

    expect(screen.getByText("DELETE_RDV")).toBeInTheDocument();
    expect(screen.queryByText("CREATE_PATIENT")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /^Tous/ }));
    expect(screen.getByText("LOGIN_SUCCESS")).toBeInTheDocument();
  });

  it("should redirect non-admin users away from audit logs", async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { role: "PATIENT" } });

    render(<AuditLogsPage />);

    expect(mockReplace).toHaveBeenCalledWith("/dashboard");
    expect(getAuditLogs).not.toHaveBeenCalled();
  });

  it("should append live SSE logs when the stream receives a new event", async () => {
    render(<AuditLogsPage />);

    await waitFor(() => expect(MockEventSource.instances.length).toBe(1));
    act(() => {
      MockEventSource.instances[0].emit("connected");
      MockEventSource.instances[0].emit("new_log", JSON.stringify({
        id: 4,
        action: "UPDATE_PATIENT",
        entite: "Patient",
        entiteId: 7,
        utilisateur: "doctor@mail.com",
        timestamp: "2026-05-14T12:00:00",
        details: "Patient mis à jour",
      }));
    });

    expect(await screen.findByText("UPDATE_PATIENT")).toBeInTheDocument();
    expect(screen.getByText("+1 en direct")).toBeInTheDocument();
    expect(screen.getByText(/Nouveau log/)).toBeInTheDocument();
  });
});
