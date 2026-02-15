import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileInfoDialog } from "./MobileInfoDialog";

describe("MobileInfoDialog", () => {
  it("renders dialog content when open", () => {
    render(<MobileInfoDialog open={true} onOpenChange={() => {}} />);

    expect(screen.getByTestId("mobileInfoDialog")).toBeInTheDocument();
    expect(screen.getByText("Best on Desktop")).toBeInTheDocument();
    expect(
      screen.getByText(/designed for desktop use/)
    ).toBeInTheDocument();
    expect(screen.getByText("Continue Reading")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<MobileInfoDialog open={false} onOpenChange={() => {}} />);

    expect(screen.queryByTestId("mobileInfoDialog")).not.toBeInTheDocument();
  });

  it("calls onOpenChange when dismiss button is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(<MobileInfoDialog open={true} onOpenChange={onOpenChange} />);

    await user.click(screen.getByTestId("mobileInfoDismissButton"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
