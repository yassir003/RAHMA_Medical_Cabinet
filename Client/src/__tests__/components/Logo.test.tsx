import { render, screen } from "@testing-library/react";
import { Logo } from "@/components/Logo";

describe("Logo", () => {
  it("should render dark logo when light prop is false", () => {
    render(<Logo />);

    const image = screen.getByAltText("logo");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "/logo-dark.png");
  });

  it("should render light logo when light prop is true", () => {
    render(<Logo light />);

    expect(screen.getByAltText("logo")).toHaveAttribute("src", "/logo-light.png");
  });

  it("should keep accessible alt text when variant changes", () => {
    const { rerender } = render(<Logo />);

    rerender(<Logo light />);

    expect(screen.getByRole("img", { name: "logo" })).toBeVisible();
  });
});
