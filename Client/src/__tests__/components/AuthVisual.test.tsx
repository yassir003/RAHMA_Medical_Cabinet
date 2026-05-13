import { render, screen } from "@testing-library/react";
import { AuthVisual } from "@/components/AuthVisual";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt, src, ...props }: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} {...props} />
  ),
}));

describe("AuthVisual", () => {
  it("should render doctor greeting image when mounted", () => {
    render(<AuthVisual />);

    expect(screen.getByAltText("Doctor greeting patient")).toBeInTheDocument();
  });

  it("should use expected illustration source when rendered", () => {
    render(<AuthVisual />);

    expect(screen.getByAltText("Doctor greeting patient")).toHaveAttribute("src", "/doctor-handshake.png");
  });

  it("should render decorative sidebar structure when displayed", () => {
    const { container } = render(<AuthVisual />);

    expect(container.querySelectorAll("div").length).toBeGreaterThanOrEqual(5);
  });
});
