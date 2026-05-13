import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatWidget from "@/components/ChatWidget";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

const fetchMock = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  fetchMock.mockReset();
  global.fetch = fetchMock;
  (useAuth as jest.Mock).mockReturnValue({ user: { token: "auth-token" } });
  (usePathname as jest.Mock).mockReturnValue("/");
  localStorage.clear();
  Element.prototype.scrollIntoView = jest.fn();
});

function okChat(reply = "Bonjour **Jane**") {
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: jest.fn().mockResolvedValue({ data: reply }),
  });
}

describe("ChatWidget", () => {
  it("should render floating open button on public pages", () => {
    render(<ChatWidget />);

    expect(screen.getByRole("button", { name: "Ouvrir Rahma Assistant" })).toBeInTheDocument();
  });

  it("should hide widget when pathname is not allowed", () => {
    (usePathname as jest.Mock).mockReturnValue("/dashboard/doctors");

    render(<ChatWidget />);

    expect(screen.queryByRole("button", { name: "Ouvrir Rahma Assistant" })).not.toBeInTheDocument();
  });

  it("should open and close chat when toggle buttons are clicked", async () => {
    render(<ChatWidget />);

    await userEvent.click(screen.getByRole("button", { name: "Ouvrir Rahma Assistant" }));
    expect(screen.getByRole("region", { name: "Rahma Assistant" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Fermer le chat" }));
    expect(screen.queryByRole("region", { name: "Rahma Assistant" })).not.toBeInTheDocument();
  });

  it("should send user message and display assistant reply when backend succeeds", async () => {
    okChat("Voici **la reponse**");
    render(<ChatWidget />);

    await userEvent.click(screen.getByRole("button", { name: "Ouvrir Rahma Assistant" }));
    await userEvent.type(screen.getByPlaceholderText("Ecrivez votre message..."), "Bonjour");
    await userEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    await waitFor(() => expect(screen.getByText("la reponse")).toBeInTheDocument());
    expect(screen.getByText("Bonjour")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/chat?token=auth-token"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("should send message with enter when shift is not pressed", async () => {
    okChat("Message recu");
    render(<ChatWidget />);

    await userEvent.click(screen.getByRole("button", { name: "Ouvrir Rahma Assistant" }));
    await userEvent.type(screen.getByPlaceholderText("Ecrivez votre message..."), "Salut{enter}");

    await waitFor(() => expect(screen.getByText("Message recu")).toBeInTheDocument());
  });

  it("should show error and restore messages when backend fails", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({ message: "Service indisponible" }),
    });
    render(<ChatWidget />);

    await userEvent.click(screen.getByRole("button", { name: "Ouvrir Rahma Assistant" }));
    await userEvent.type(screen.getByPlaceholderText("Ecrivez votre message..."), "Aide");
    await userEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    await waitFor(() => expect(screen.getByText("Service indisponible")).toBeInTheDocument());
    expect(screen.queryByText("Aide")).not.toBeInTheDocument();
  });
});
