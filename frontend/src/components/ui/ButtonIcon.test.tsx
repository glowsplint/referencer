import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ButtonIcon } from "./ButtonIcon";

describe("ButtonIcon", () => {
  describe("when rendered with an icon", () => {
    it("then displays the provided icon", () => {
      render(<ButtonIcon icon={<span data-testid="icon">X</span>} callback={() => {}} />);
      expect(screen.getByTestId("icon")).toBeInTheDocument();
    });
  });

  describe("when clicked", () => {
    it("then triggers the provided action", () => {
      const cb = vi.fn();
      render(<ButtonIcon icon={<span>X</span>} callback={cb} />);
      fireEvent.click(screen.getByRole("button"));
      expect(cb).toHaveBeenCalledOnce();
    });
  });

  describe("when a title is set", () => {
    it("then shows it as a tooltip", () => {
      render(<ButtonIcon icon={<span>X</span>} callback={() => {}} title="My title" />);
      expect(screen.getByTitle("My title")).toBeInTheDocument();
    });
  });

  describe("when disabled", () => {
    it("then disables the button element", () => {
      render(<ButtonIcon icon={<span>X</span>} callback={() => {}} disabled />);
      expect(screen.getByRole("button")).toBeDisabled();
    });
  });

  describe("when extra button props are provided", () => {
    it("then spreads them onto the underlying button element", () => {
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
});
