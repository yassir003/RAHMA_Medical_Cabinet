import { render, screen } from "@testing-library/react";
import RootLayout, { metadata } from "@/app/layout";
import { AuthProviderWrapper } from "@/app/providers";
import AuthLayout from "@/app/(auth)/layout";

jest.mock("next/font/google", () => ({
  Geist: () => ({ variable: "geist-sans" }),
  Geist_Mono: () => ({ variable: "geist-mono" }),
}));

jest.mock("@/context/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
}));

jest.mock("@/components/ChatWidget", () => ({
  __esModule: true,
  default: () => <div data-testid="chat-widget">Chat widget</div>,
}));

jest.mock("@/components/Logo", () => ({
  Logo: ({ light }: { light?: boolean }) => (
    <div data-testid="logo">{light ? "Light logo" : "Logo"}</div>
  ),
}));

jest.mock("@/components/AuthVisual", () => ({
  AuthVisual: () => <div data-testid="auth-visual">Auth visual</div>,
}));

describe("app layouts and providers", () => {
  it("should expose root metadata for the medical cabinet app", () => {
    expect(metadata).toMatchObject({
      title: "Rahma Medical Cabinet",
      description: "Secure system for managing medical appointments and records",
    });
  });

  it("should wrap root children with auth provider and chat widget", () => {
    const tree: any = RootLayout({
      children: <main>Dashboard child</main>,
    });

    expect(tree.type).toBe("html");
    expect(tree.props.lang).toBe("en");
    expect(tree.props.className).toContain("geist-sans");
    expect(tree.props.className).toContain("geist-mono");
    expect(tree.props.children.type).toBe("body");
    expect(tree.props.children.props.children.type).toBe(AuthProviderWrapper);
  });

  it("should render provider wrapper and auth layout shell around children", () => {
    render(
      <>
        <AuthProviderWrapper>
          <span>Wrapped content</span>
        </AuthProviderWrapper>
        <AuthLayout>
          <form>Login form</form>
        </AuthLayout>
      </>
    );

    expect(screen.getByText("Wrapped content")).toBeInTheDocument();
    expect(screen.getAllByTestId("chat-widget").length).toBeGreaterThan(0);
    expect(screen.getByTestId("logo")).toHaveTextContent("Light logo");
    expect(screen.getByTestId("auth-visual")).toBeInTheDocument();
    expect(screen.getByText("Login form")).toBeInTheDocument();
  });
});
