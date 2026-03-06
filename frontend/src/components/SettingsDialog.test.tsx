import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SettingsDialog } from "./SettingsDialog";

function renderDialog(overrides: Record<string, unknown> = {}) {
  const props = {
    open: true,
    onOpenChange: vi.fn(),
    isDarkMode: false,
    toggleDarkMode: vi.fn(),
    hideOffscreenArrows: false,
    toggleHideOffscreenArrows: vi.fn(),
    showStatusBar: true,
    toggleShowStatusBar: vi.fn(),
    overscroll: true,
    toggleOverscroll: vi.fn(),
    ...overrides,
  };
  render(<SettingsDialog {...props} />);
  return props;
}

describe("SettingsDialog", () => {
  describe("when opened", () => {
    it("then shows the settings title and description", () => {
      renderDialog();
      expect(screen.getByTestId("settingsDialog")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
      expect(screen.getByText("Customize your document preferences.")).toBeInTheDocument();
    });

    it("then shows all setting rows", () => {
      renderDialog();
      expect(screen.getByText("Dark mode")).toBeInTheDocument();
      expect(screen.getByText("Hide off-screen arrows")).toBeInTheDocument();
      expect(screen.getByText("Status bar")).toBeInTheDocument();
      expect(screen.getByText("Overscroll")).toBeInTheDocument();
    });

    it("then does not show removed toast notification settings", () => {
      renderDialog();
      expect(screen.queryByText("Drawing notifications")).not.toBeInTheDocument();
      expect(screen.queryByText("Comments notifications")).not.toBeInTheDocument();
      expect(screen.queryByText("Highlight notifications")).not.toBeInTheDocument();
    });
  });

  describe("when open is false", () => {
    it("then does not render the dialog", () => {
      renderDialog({ open: false });
      expect(screen.queryByTestId("settingsDialog")).not.toBeInTheDocument();
    });
  });

  describe("when the dark mode switch is clicked", () => {
    it("then calls toggleDarkMode", () => {
      const props = renderDialog();
      fireEvent.click(screen.getByTestId("dark-mode-switch"));
      expect(props.toggleDarkMode).toHaveBeenCalledOnce();
    });
  });

  describe("when the hide off-screen arrows switch is clicked", () => {
    it("then calls toggleHideOffscreenArrows", () => {
      const props = renderDialog();
      fireEvent.click(screen.getByTestId("hide-offscreen-arrows-switch"));
      expect(props.toggleHideOffscreenArrows).toHaveBeenCalledOnce();
    });
  });

  describe("when the status bar switch is clicked", () => {
    it("then calls toggleShowStatusBar", () => {
      const props = renderDialog();
      fireEvent.click(screen.getByTestId("show-status-bar-switch"));
      expect(props.toggleShowStatusBar).toHaveBeenCalledOnce();
    });
  });

  describe("when isDarkMode is true", () => {
    it("then renders the dark mode switch as checked", () => {
      renderDialog({ isDarkMode: true });
      expect(screen.getByTestId("dark-mode-switch")).toHaveAttribute("aria-checked", "true");
    });
  });

  describe("when isDarkMode is false", () => {
    it("then renders the dark mode switch as unchecked", () => {
      renderDialog({ isDarkMode: false });
      expect(screen.getByTestId("dark-mode-switch")).toHaveAttribute("aria-checked", "false");
    });
  });

  describe("when hideOffscreenArrows is true", () => {
    it("then renders the hide off-screen arrows switch as checked", () => {
      renderDialog({ hideOffscreenArrows: true });
      expect(screen.getByTestId("hide-offscreen-arrows-switch")).toHaveAttribute(
        "aria-checked",
        "true",
      );
    });
  });

  describe("when showStatusBar is true", () => {
    it("then renders the status bar switch as checked", () => {
      renderDialog({ showStatusBar: true });
      expect(screen.getByTestId("show-status-bar-switch")).toHaveAttribute("aria-checked", "true");
    });
  });

  describe("when showStatusBar is false", () => {
    it("then renders the status bar switch as unchecked", () => {
      renderDialog({ showStatusBar: false });
      expect(screen.getByTestId("show-status-bar-switch")).toHaveAttribute("aria-checked", "false");
    });
  });

  describe("when opened", () => {
    it("then shows overscroll setting row", () => {
      renderDialog();
      expect(screen.getByText("Overscroll")).toBeInTheDocument();
      expect(
        screen.getByText("Scroll past the last line of text in the editor"),
      ).toBeInTheDocument();
    });
  });

  describe("when the overscroll switch is clicked", () => {
    it("then calls toggleOverscroll", () => {
      const props = renderDialog();
      fireEvent.click(screen.getByTestId("overscroll-switch"));
      expect(props.toggleOverscroll).toHaveBeenCalledOnce();
    });
  });

  describe("when overscroll is true", () => {
    it("then renders the overscroll switch as checked", () => {
      renderDialog({ overscroll: true });
      expect(screen.getByTestId("overscroll-switch")).toHaveAttribute("aria-checked", "true");
    });
  });

  describe("when overscroll is false", () => {
    it("then renders the overscroll switch as unchecked", () => {
      renderDialog({ overscroll: false });
      expect(screen.getByTestId("overscroll-switch")).toHaveAttribute("aria-checked", "false");
    });
  });
});
