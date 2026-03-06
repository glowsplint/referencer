import { screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { StudySchemePicker } from "./StudySchemePicker";
import { STUDY_SCHEMES } from "@/constants/study-schemes";
import { renderWithDocument } from "@/test/render-with-document";

function renderPicker(overrides = {}, pickerProps: { open?: boolean } = {}) {
  const onOpenChange = vi.fn();
  const onBlankLayer = vi.fn();
  const result = renderWithDocument(
    <StudySchemePicker
      open={pickerProps.open ?? true}
      onOpenChange={onOpenChange}
      onBlankLayer={onBlankLayer}
    >
      <button data-testid="anchor">Anchor</button>
    </StudySchemePicker>,
    overrides,
  );
  return { ...result, onOpenChange, onBlankLayer };
}

describe("StudySchemePicker", () => {
  describe("when open", () => {
    it("renders the popover with all schemes", () => {
      renderPicker();
      expect(screen.getByTestId("schemePickerPopover")).toBeInTheDocument();
      for (const scheme of STUDY_SCHEMES) {
        expect(screen.getByTestId(`scheme-${scheme.id}`)).toBeInTheDocument();
      }
    });

    it("renders the blank layer option", () => {
      renderPicker();
      expect(screen.getByTestId("scheme-blank")).toBeInTheDocument();
    });

    it("shows scheme names and descriptions", () => {
      renderPicker();
      expect(screen.getByText("Inductive Bible Study")).toBeInTheDocument();
      expect(screen.getByText("Close reading with OIA method")).toBeInTheDocument();
      expect(screen.getByText("Character Study")).toBeInTheDocument();
      expect(screen.getByText("Minimal (OIA)")).toBeInTheDocument();
    });

    it("shows layer counts for each scheme", () => {
      renderPicker();
      expect(screen.getByText("6 layers")).toBeInTheDocument();
      expect(screen.getByText("4 layers")).toBeInTheDocument();
      expect(screen.getByText("3 layers")).toBeInTheDocument();
    });
  });

  describe("when a scheme is clicked", () => {
    it("calls addLayer for each layer in the scheme", () => {
      const { document, onOpenChange } = renderPicker();
      fireEvent.click(screen.getByTestId("scheme-inductive"));

      const inductiveScheme = STUDY_SCHEMES.find((s) => s.id === "inductive")!;
      expect(document.addLayer).toHaveBeenCalledTimes(inductiveScheme.layers.length);

      // Verify first and last layer names/colors
      expect(document.addLayer).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Key Terms & Repeated Words",
          color: "#fcd34d",
        }),
      );
      expect(document.addLayer).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Questions & Application",
          color: "#f9a8d4",
        }),
      );

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("calls addLayer for character study scheme", () => {
      const { document } = renderPicker();
      fireEvent.click(screen.getByTestId("scheme-character"));
      expect(document.addLayer).toHaveBeenCalledTimes(4);
      expect(document.addLayer).toHaveBeenCalledWith(
        expect.objectContaining({ name: "God / Christ", color: "#93c5fd" }),
      );
    });

    it("calls addLayer for OIA scheme", () => {
      const { document } = renderPicker();
      fireEvent.click(screen.getByTestId("scheme-oia"));
      expect(document.addLayer).toHaveBeenCalledTimes(3);
      expect(document.addLayer).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Observation", color: "#fcd34d" }),
      );
      expect(document.addLayer).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Interpretation", color: "#93c5fd" }),
      );
      expect(document.addLayer).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Application", color: "#86efac" }),
      );
    });
  });

  describe("when blank layer is clicked", () => {
    it("calls onBlankLayer and closes", () => {
      const { onBlankLayer, onOpenChange } = renderPicker();
      fireEvent.click(screen.getByTestId("scheme-blank"));
      expect(onBlankLayer).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("when closed", () => {
    it("does not render the popover content", () => {
      renderPicker({}, { open: false });
      expect(screen.queryByTestId("schemePickerPopover")).not.toBeInTheDocument();
    });
  });
});
