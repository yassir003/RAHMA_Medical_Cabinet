import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChangePasswordPage from "@/app/(auth)/change-password/page";
import LoginPage from "@/app/(auth)/login/page";
import RegisterPage from "@/app/(auth)/register/page";
import { useAuth } from "@/context/AuthContext";

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {
    status: number;

    constructor(message: string, status = 400) {
      super(message);
      this.status = status;
    }
  },
}));

const login = jest.fn();
const register = jest.fn();
const changePassword = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useAuth as jest.Mock).mockReturnValue({ login, register, changePassword });
});

describe("auth pages", () => {
  it("should validate login form when credentials are empty", async () => {
    render(<LoginPage />);

    await userEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(screen.getByText("Please enter both email and password")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it("should call login when credentials are provided", async () => {
    login.mockResolvedValue(undefined);
    render(<LoginPage />);

    await userEvent.type(screen.getByPlaceholderText("you@example.com"), "patient@mail.com");
    await userEvent.type(screen.getByPlaceholderText("Type your password here"), "Password123");
    await userEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => expect(login).toHaveBeenCalledWith("patient@mail.com", "Password123"));
  });

  it("should show not found helper when login fails with 404 api error", async () => {
    const { ApiError } = await import("@/lib/api");
    login.mockRejectedValue(new ApiError("missing", 404));
    render(<LoginPage />);

    await userEvent.type(screen.getByPlaceholderText("you@example.com"), "missing@mail.com");
    await userEvent.type(screen.getByPlaceholderText("Type your password here"), "Password123");
    await userEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => expect(screen.getByText(/Aucun compte/)).toBeInTheDocument());
    expect(screen.getAllByText(/Créer un compte|CrÃ©er un compte/).length).toBeGreaterThan(0);
  });

  it("should validate register form when required fields are missing", async () => {
    render(<RegisterPage />);

    await userEvent.click(screen.getByRole("button", { name: /Créer mon compte/ }));

    expect(screen.getByText(/CIN, email et mot de passe/)).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it("should call register when patient form is valid", async () => {
    register.mockResolvedValue(undefined);
    render(<RegisterPage />);

    await userEvent.type(screen.getByPlaceholderText("Alaoui"), "Doe");
    await userEvent.type(screen.getByPlaceholderText("Sara"), "Jane");
    await userEvent.type(screen.getByPlaceholderText("AB123456"), "AB123456");
    await userEvent.type(screen.getByPlaceholderText("vous@example.com"), "jane@mail.com");
    await userEvent.type(screen.getByPlaceholderText("8 caractères minimum"), "Password123");
    await userEvent.click(screen.getByRole("button", { name: /Créer mon compte/ }));

    await waitFor(() => expect(register).toHaveBeenCalledWith(expect.objectContaining({
      nom: "Doe",
      prenom: "Jane",
      cin: "AB123456",
      email: "jane@mail.com",
      password: "Password123",
    })));
  });

  it("should validate change password form when fields are empty", async () => {
    render(<ChangePasswordPage />);

    await userEvent.click(screen.getByRole("button", { name: /Confirmer le nouveau mot de passe/ }));

    expect(screen.getByText("Les deux champs sont obligatoires")).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("should call change password when password form is valid", async () => {
    changePassword.mockResolvedValue(undefined);
    render(<ChangePasswordPage />);

    await userEvent.type(screen.getByPlaceholderText("Votre CIN ou mot de passe actuel"), "OldPassword123");
    await userEvent.type(screen.getByPlaceholderText("Au moins 8 caractères"), "NewPassword123");
    await userEvent.click(screen.getByRole("button", { name: /Confirmer le nouveau mot de passe/ }));

    await waitFor(() => expect(changePassword).toHaveBeenCalledWith("OldPassword123", "NewPassword123"));
  });
});
