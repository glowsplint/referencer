import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ButtonIcon } from "./ButtonIcon";

describe("ButtonIcon", () => {
  it("renders the icon", () => {
    render(<ButtonIcon icon={<span data-testid="icon">X</span>} callback={() => {}} />);
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("calls callback on click", () => {
    const cb = vi.fn();
    render(<ButtonIcon icon={<span>X</span>} callback={cb} />);
    fireEvent.click(screen.getByRole("button"));
    expect(cb).toHaveBeenCalledOnce();
  });

  it("renders title when provided", () => {
    render(<ButtonIcon icon={<span>X</span>} callback={() => {}} title="My title" />);
    expect(screen.getByTitle("My title")).toBeInTheDocument();
  });

  it("spreads buttonProps onto the button", () => {
    render(
      <ButtonIcon
        icon={<span>X</span>}
        callback={() => {}}
        buttonProps={{ "data-testid": "custom" }}
      />,
    );
    expect(screen.getByTestId("custom")).toBeInTheDocument();
  });
});
