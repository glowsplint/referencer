import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SettingsDialog } from "./SettingsDialog";

function renderDialog(overrides: Record<string, unknown> = {}) {
  const props = {
    open: true,
    onOpenChange: vi.fn(),
    theme: "auto" as const,
    setTheme: vi.fn(),
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

    it("then shows the theme selector with 5 cards", () => {
      renderDialog();
      expect(screen.getByTestId("theme-selector")).toBeInTheDocument();
      expect(screen.getByTestId("theme-card-auto")).toBeInTheDocument();
      expect(screen.getByTestId("theme-card-light")).toBeInTheDocument();
      expect(screen.getByTestId("theme-card-dark")).toBeInTheDocument();
      expect(screen.getByTestId("theme-card-sepia")).toBeInTheDocument();
      expect(screen.getByTestId("theme-card-high-contrast")).toBeInTheDocument();
    });

    it("then shows all setting rows", () => {
      renderDialog();
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

  describe("when a theme card is clicked", () => {
    it("then calls setTheme with the selected theme", () => {
      const props = renderDialog();
      fireEvent.click(screen.getByTestId("theme-card-dark"));
      expect(props.setTheme).toHaveBeenCalledWith("dark");
    });

    it("then calls setTheme with sepia when sepia card is clicked", () => {
      const props = renderDialog();
      fireEvent.click(screen.getByTestId("theme-card-sepia"));
      expect(props.setTheme).toHaveBeenCalledWith("sepia");
    });

    it("then calls setTheme with high-contrast when high-contrast card is clicked", () => {
      const props = renderDialog();
      fireEvent.click(screen.getByTestId("theme-card-high-contrast"));
      expect(props.setTheme).toHaveBeenCalledWith("high-contrast");
    });
  });

  describe("when the current theme is dark", () => {
    it("then the dark theme card has ring highlight", () => {
      renderDialog({ theme: "dark" });
      const darkCard = screen.getByTestId("theme-card-dark");
      expect(darkCard.className).toContain("ring-2");
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
