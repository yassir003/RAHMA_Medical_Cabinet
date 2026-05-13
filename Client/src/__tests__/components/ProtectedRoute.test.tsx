import { render, screen, waitFor } from "@testing-library/react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

const replace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/dashboard",
}));

describe("ProtectedRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render loading spinner when auth state is loading", () => {
    (useAuth as jest.Mock).mockReturnValue({ isLoading: true, isAuthenticated: false, user: null });

    const { container } = render(<ProtectedRoute><main>Secret area</main></ProtectedRoute>);

    expect(container.querySelector("style")).toHaveTextContent("spin");
    expect(screen.queryByText("Secret area")).not.toBeInTheDocument();
  });

  it("should redirect to login when user is not authenticated", async () => {
    (useAuth as jest.Mock).mockReturnValue({ isLoading: false, isAuthenticated: false, user: null });

    render(<ProtectedRoute><main>Secret area</main></ProtectedRoute>);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("Secret area")).not.toBeInTheDocument();
  });

  it("should redirect to change password when password has not been changed", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { passwordChanged: false },
    });

    render(<ProtectedRoute><main>Secret area</main></ProtectedRoute>);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/change-password"));
    expect(screen.queryByText("Secret area")).not.toBeInTheDocument();
  });

  it("should render children when user is authenticated and password is changed", () => {
    (useAuth as jest.Mock).mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { passwordChanged: true },
    });

    render(<ProtectedRoute><main>Secret area</main></ProtectedRoute>);

    expect(screen.getByText("Secret area")).toBeInTheDocument();
  });
});
