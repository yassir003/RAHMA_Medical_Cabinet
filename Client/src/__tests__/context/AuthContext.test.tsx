import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, defaultRouteForRole, useAuth } from "@/context/AuthContext";
import { changePasswordApi, login as apiLogin, register as apiRegister } from "@/lib/api";

jest.mock("@/lib/api", () => ({
  login: jest.fn(),
  register: jest.fn(),
  changePasswordApi: jest.fn(),
  ApiError: class ApiError extends Error {},
}));

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

function token(payload: Record<string, unknown>) {
  return `header.${btoa(JSON.stringify(payload))}.signature`;
}

function Consumer() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(auth.isLoading)}</span>
      <span data-testid="email">{auth.user?.email ?? "none"}</span>
      <span data-testid="authenticated">{String(auth.isAuthenticated)}</span>
      <button type="button" onClick={() => auth.login("doctor@mail.com", "secret")}>login</button>
      <button type="button" onClick={() => auth.register({
        nom: "Doe",
        prenom: "Jane",
        cin: "AB123",
        email: "patient@mail.com",
        password: "secret",
      })}>register</button>
      <button type="button" onClick={() => auth.changePassword("old", "new")}>change</button>
      <button type="button" onClick={auth.logout}>logout</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("should return default dashboard route when role is known", () => {
    expect(defaultRouteForRole("ADMIN")).toBe("/dashboard");
    expect(defaultRouteForRole("MEDECIN")).toBe("/dashboard/doctors");
    expect(defaultRouteForRole("SECRETAIRE")).toBe("/dashboard/secretary");
    expect(defaultRouteForRole("PATIENT")).toBe("/dashboard/patient");
  });

  it("should rehydrate user from storage when provider mounts", async () => {
    localStorage.setItem("rahma_auth_user", JSON.stringify({
      email: "patient@mail.com",
      role: "PATIENT",
      token: "stored-token",
      passwordChanged: true,
    }));

    render(<AuthProvider><Consumer /></AuthProvider>);

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(screen.getByTestId("email")).toHaveTextContent("patient@mail.com");
    expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
  });

  it("should persist user and redirect to role dashboard when login succeeds", async () => {
    (apiLogin as jest.Mock).mockResolvedValue({
      email: "doctor@mail.com",
      role: "MEDECIN",
      token: token({ userId: 42 }),
      passwordChanged: true,
    });

    render(<AuthProvider><Consumer /></AuthProvider>);
    await userEvent.click(screen.getByRole("button", { name: "login" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard/doctors"));
    expect(JSON.parse(localStorage.getItem("rahma_auth_user") ?? "{}")).toMatchObject({
      email: "doctor@mail.com",
      role: "MEDECIN",
      userId: 42,
    });
  });

  it("should redirect to change password when registered user must change password", async () => {
    (apiRegister as jest.Mock).mockResolvedValue({
      email: "patient@mail.com",
      role: "PATIENT",
      token: token({ userId: 7 }),
      passwordChanged: false,
    });

    render(<AuthProvider><Consumer /></AuthProvider>);
    await userEvent.click(screen.getByRole("button", { name: "register" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/change-password"));
  });

  it("should update password flag and redirect when password change succeeds", async () => {
    localStorage.setItem("rahma_auth_user", JSON.stringify({
      email: "patient@mail.com",
      role: "PATIENT",
      token: "stored-token",
      passwordChanged: false,
    }));
    (changePasswordApi as jest.Mock).mockResolvedValue(undefined);

    render(<AuthProvider><Consumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    await userEvent.click(screen.getByRole("button", { name: "change" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard/patient"));
    expect(JSON.parse(localStorage.getItem("rahma_auth_user") ?? "{}").passwordChanged).toBe(true);
  });

  it("should clear user and redirect when logout is clicked", async () => {
    localStorage.setItem("rahma_auth_user", JSON.stringify({
      email: "patient@mail.com",
      role: "PATIENT",
      token: "stored-token",
      passwordChanged: true,
    }));

    render(<AuthProvider><Consumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    await userEvent.click(screen.getByRole("button", { name: "logout" }));

    expect(localStorage.getItem("rahma_auth_user")).toBeNull();
    expect(push).toHaveBeenCalledWith("/login");
  });
});
