import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ActionConsole } from "./ActionConsole";
import type { ActionEntry } from "@/types/editor";

function makeEntry(overrides: Partial<ActionEntry> = {}): ActionEntry {
  return {
    id: crypto.randomUUID(),
    type: "addLayer",
    description: "Created layer 'Layer 1'",
    timestamp: Date.now(),
    undone: false,
    ...overrides,
  };
}

const defaultProps = {
  log: [] as ActionEntry[],
  isOpen: true,
  onClose: vi.fn(),
  height: 192,
  onHeightChange: vi.fn(),
};

describe("ActionConsole", () => {
  describe("when closed", () => {
    it("then renders nothing", () => {
      render(<ActionConsole {...defaultProps} isOpen={false} />);
      expect(screen.queryByTestId("actionConsole")).not.toBeInTheDocument();
    });
  });

  describe("when open", () => {
    it("then shows the console with title", () => {
      render(<ActionConsole {...defaultProps} />);
      expect(screen.getByTestId("actionConsole")).toBeInTheDocument();
      expect(screen.getByText("Action Console")).toBeInTheDocument();
    });

    it("then shows the drag handle", () => {
      render(<ActionConsole {...defaultProps} />);
      expect(screen.getByTestId("consoleDragHandle")).toBeInTheDocument();
    });
  });

  describe("when open with no log entries", () => {
    it("then shows an empty state message", () => {
      render(<ActionConsole {...defaultProps} />);
      expect(screen.getByText("No actions recorded yet.")).toBeInTheDocument();
    });
  });

  describe("when open with log entries", () => {
    it("then displays each entry description and type", () => {
      const entries = [
        makeEntry({ type: "addLayer", description: "Created layer 'Layer 1'" }),
        makeEntry({ type: "addHighlight", description: "Highlighted 'hello' in Layer 1" }),
      ];
      render(<ActionConsole {...defaultProps} log={entries} />);

      expect(screen.getByText("Created layer 'Layer 1'")).toBeInTheDocument();
      expect(screen.getByText("Highlighted 'hello' in Layer 1")).toBeInTheDocument();
      expect(screen.getByText("[addLayer]")).toBeInTheDocument();
      expect(screen.getByText("[addHighlight]")).toBeInTheDocument();
    });

    it("then visually distinguishes undone entries", () => {
      const entry = makeEntry({ undone: true, description: "Undone action" });
      render(<ActionConsole {...defaultProps} log={[entry]} />);

      const desc = screen.getByText("Undone action");
      // The wrapper div applies opacity-40 for undone entries
      expect(desc.closest("[class*='opacity-40']")).toBeTruthy();
    });

    it("then renders entries without details normally", () => {
      const entry = makeEntry();
      render(<ActionConsole {...defaultProps} log={[entry]} />);

      expect(screen.getByText("Created layer 'Layer 1'")).toBeInTheDocument();
      expect(screen.queryByTestId("actionDetail")).not.toBeInTheDocument();
    });
  });

  describe("when the close button is clicked", () => {
    it("then calls onClose", () => {
      const onClose = vi.fn();
      render(<ActionConsole {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByTestId("actionConsoleClose"));
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  describe("when the drag handle is used to resize", () => {
    it("then calls onHeightChange with the computed height", () => {
      const onHeightChange = vi.fn();
      render(<ActionConsole {...defaultProps} height={200} onHeightChange={onHeightChange} />);

      const handle = screen.getByTestId("consoleDragHandle");

      fireEvent.mouseDown(handle, { clientY: 500 });
      fireEvent.mouseMove(document, { clientY: 450 });

      expect(onHeightChange).toHaveBeenCalledWith(250);

      fireEvent.mouseUp(document);
    });

    describe("when dragged below minimum", () => {
      it("then clamps height to 80px", () => {
        const onHeightChange = vi.fn();
        render(<ActionConsole {...defaultProps} height={100} onHeightChange={onHeightChange} />);

        const handle = screen.getByTestId("consoleDragHandle");

        fireEvent.mouseDown(handle, { clientY: 500 });
        fireEvent.mouseMove(document, { clientY: 700 });

        expect(onHeightChange).toHaveBeenCalledWith(80);

        fireEvent.mouseUp(document);
      });
    });

    describe("when dragged above maximum", () => {
      it("then clamps height to 600px", () => {
        const onHeightChange = vi.fn();
        render(<ActionConsole {...defaultProps} height={500} onHeightChange={onHeightChange} />);

        const handle = screen.getByTestId("consoleDragHandle");

        fireEvent.mouseDown(handle, { clientY: 500 });
        fireEvent.mouseMove(document, { clientY: 300 });

        expect(onHeightChange).toHaveBeenCalledWith(600);

        fireEvent.mouseUp(document);
      });
    });
  });

  describe("when an entry has before and after details", () => {
    it("then shows label, before value, arrow, and after value", () => {
      const entry = makeEntry({
        details: [{ label: "name", before: "Old", after: "New" }],
      });
      render(<ActionConsole {...defaultProps} log={[entry]} />);

      const detail = screen.getByTestId("actionDetail");
      expect(detail).toHaveTextContent("name:");
      expect(detail).toHaveTextContent("Old");
      expect(detail).toHaveTextContent("\u2192");
      expect(detail).toHaveTextContent("New");
    });
  });

  describe("when an entry has before-only detail", () => {
    it("then shows the value without an arrow", () => {
      const entry = makeEntry({
        details: [{ label: "count", before: "3" }],
      });
      render(<ActionConsole {...defaultProps} log={[entry]} />);

      const detail = screen.getByTestId("actionDetail");
      expect(detail).toHaveTextContent("count:");
      expect(detail).toHaveTextContent("3");
      expect(detail).not.toHaveTextContent("\u2192");
    });
  });

  describe("when an entry has after-only detail", () => {
    it("then shows the value without an arrow", () => {
      const entry = makeEntry({
        details: [{ label: "text", after: "hello" }],
      });
      render(<ActionConsole {...defaultProps} log={[entry]} />);

      const detail = screen.getByTestId("actionDetail");
      expect(detail).toHaveTextContent("text:");
      expect(detail).toHaveTextContent("hello");
      expect(detail).not.toHaveTextContent("\u2192");
    });
  });

  describe("when an entry has multiple detail lines", () => {
    it("then renders all detail lines", () => {
      const entry = makeEntry({
        details: [
          { label: "name", after: "Layer 1" },
          { label: "color", after: "#fca5a5" },
        ],
      });
      render(<ActionConsole {...defaultProps} log={[entry]} />);

      const details = screen.getAllByTestId("actionDetail");
      expect(details).toHaveLength(2);
      expect(details[0]).toHaveTextContent("name:");
      expect(details[1]).toHaveTextContent("color:");
    });
  });

  describe("when detail values are hex colors", () => {
    it("then renders color swatches", () => {
      const entry = makeEntry({
        details: [{ label: "color", before: "#fca5a5", after: "#93c5fd" }],
      });
      render(<ActionConsole {...defaultProps} log={[entry]} />);

      const swatches = screen.getAllByTestId("colorSwatch");
      expect(swatches).toHaveLength(2);
    });
  });
});
