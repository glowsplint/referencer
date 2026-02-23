import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SettingsDialog } from "./SettingsDialog";

function renderDialog(overrides: Record<string, unknown> = {}) {
  const props = {
    open: true,
    onOpenChange: vi.fn(),
    isDarkMode: false,
    toggleDarkMode: vi.fn(),
    overscrollEnabled: false,
    toggleOverscrollEnabled: vi.fn(),
    hideOffscreenArrows: false,
    toggleHideOffscreenArrows: vi.fn(),
    showStatusBar: true,
    toggleShowStatusBar: vi.fn(),
    ...overrides,
  };
  render(<SettingsDialog {...props} />);
  return props;
}

describe("SettingsDialog", () => {
  it("renders dialog with title and description", () => {
    renderDialog();
    expect(screen.getByTestId("settingsDialog")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Customize your workspace preferences.")).toBeInTheDocument();
  });

  it("renders all setting rows", () => {
    renderDialog();
    expect(screen.getByText("Dark mode")).toBeInTheDocument();
    expect(screen.getByText("Overscroll")).toBeInTheDocument();
    expect(screen.getByText("Hide off-screen arrows")).toBeInTheDocument();
    expect(screen.getByText("Status bar")).toBeInTheDocument();
  });

  it("does not render removed toast notification settings", () => {
    renderDialog();
    expect(screen.queryByText("Drawing notifications")).not.toBeInTheDocument();
    expect(screen.queryByText("Comments notifications")).not.toBeInTheDocument();
    expect(screen.queryByText("Highlight notifications")).not.toBeInTheDocument();
  });

  it("renders switches with correct checked state", () => {
    renderDialog({ isDarkMode: true, overscrollEnabled: false });
    expect(screen.getByTestId("dark-mode-switch")).toHaveAttribute("data-state", "checked");
    expect(screen.getByTestId("overscroll-switch")).toHaveAttribute("data-state", "unchecked");
  });

  it("calls toggleDarkMode when dark mode switch is clicked", () => {
    const props = renderDialog();
    fireEvent.click(screen.getByTestId("dark-mode-switch"));
    expect(props.toggleDarkMode).toHaveBeenCalledOnce();
  });

  it("renders overscroll switch with correct checked state", () => {
    renderDialog({ overscrollEnabled: true });
    expect(screen.getByTestId("overscroll-switch")).toHaveAttribute("data-state", "checked");
  });

  it("calls toggleOverscrollEnabled when overscroll switch is clicked", () => {
    const props = renderDialog();
    fireEvent.click(screen.getByTestId("overscroll-switch"));
    expect(props.toggleOverscrollEnabled).toHaveBeenCalledOnce();
  });

  it("renders hide off-screen arrows switch with correct checked state", () => {
    renderDialog({ hideOffscreenArrows: true });
    expect(screen.getByTestId("hide-offscreen-arrows-switch")).toHaveAttribute(
      "data-state",
      "checked",
    );
  });

  it("calls toggleHideOffscreenArrows when switch is clicked", () => {
    const props = renderDialog();
    fireEvent.click(screen.getByTestId("hide-offscreen-arrows-switch"));
    expect(props.toggleHideOffscreenArrows).toHaveBeenCalledOnce();
  });

  it("renders status bar switch with correct checked state", () => {
    renderDialog({ showStatusBar: true });
    expect(screen.getByTestId("show-status-bar-switch")).toHaveAttribute("data-state", "checked");
  });

  it("renders status bar switch as unchecked when disabled", () => {
    renderDialog({ showStatusBar: false });
    expect(screen.getByTestId("show-status-bar-switch")).toHaveAttribute("data-state", "unchecked");
  });

  it("calls toggleShowStatusBar when status bar switch is clicked", () => {
    const props = renderDialog();
    fireEvent.click(screen.getByTestId("show-status-bar-switch"));
    expect(props.toggleShowStatusBar).toHaveBeenCalledOnce();
  });

  it("does not render when open is false", () => {
    renderDialog({ open: false });
    expect(screen.queryByTestId("settingsDialog")).not.toBeInTheDocument();
  });
});
