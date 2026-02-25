import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileInfoDialog } from "./MobileInfoDialog";

describe("MobileInfoDialog", () => {
  describe("when opened", () => {
    it("shows the desktop recommendation message", () => {
      render(<MobileInfoDialog open={true} onOpenChange={() => {}} />);

      expect(screen.getByTestId("mobileInfoDialog")).toBeInTheDocument();
      expect(screen.getByText("Best on Desktop")).toBeInTheDocument();
      expect(screen.getByText(/designed for desktop use/)).toBeInTheDocument();
    });
  });

  describe("when closed", () => {
    it("renders nothing", () => {
      render(<MobileInfoDialog open={false} onOpenChange={() => {}} />);

      expect(screen.queryByTestId("mobileInfoDialog")).not.toBeInTheDocument();
    });
  });

  describe("when close button is clicked", () => {
    it("calls onOpenChange with false", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(<MobileInfoDialog open={true} onOpenChange={onOpenChange} />);

      await user.click(screen.getByRole("button", { name: "Close" }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
