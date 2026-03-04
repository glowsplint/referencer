import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatusBar } from "./StatusBar";

describe("StatusBar", () => {
  describe("when no message is active", () => {
    it("then shows an empty status bar", () => {
      render(<StatusBar message={null} />);
      const bar = screen.getByTestId("status-bar");
      expect(bar).toBeInTheDocument();
      expect(bar).toBeEmptyDOMElement();
    });
  });

  describe("when displaying an info message", () => {
    it("then shows the message text", () => {
      render(<StatusBar message={{ text: "Click a word", type: "info" }} />);
      expect(screen.getByTestId("status-bar")).toHaveTextContent("Click a word");
    });

    it("then does not show a confirmation icon", () => {
      render(<StatusBar message={{ text: "Some info", type: "info" }} />);
      expect(screen.queryByRole("img", { hidden: true })).not.toBeInTheDocument();
      // Lucide icons render as SVGs without a role — verify no SVG child exists
      const bar = screen.getByTestId("status-bar");
      expect(bar.querySelector("svg")).not.toBeInTheDocument();
    });
  });

  describe("when displaying a success message", () => {
    it("then shows the message text with a confirmation icon", () => {
      render(<StatusBar message={{ text: "Arrow created", type: "success" }} />);
      const bar = screen.getByTestId("status-bar");
      expect(bar).toHaveTextContent("Arrow created");
      expect(bar.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("when the message contains rich content", () => {
    it("then renders the ReactNode text and preserves inline elements", () => {
      render(
        <StatusBar
          message={{
            text: (
              <span>
                Press <kbd>Enter</kbd>
              </span>
            ),
            type: "info",
          }}
        />,
      );
      const bar = screen.getByTestId("status-bar");
      expect(bar).toHaveTextContent("Press Enter");
      expect(bar.querySelector("kbd")).toBeInTheDocument();
    });
  });

  describe("pane context", () => {
    describe("when paneName and paneLocked are provided with a message", () => {
      it("then shows the pane context prefix followed by the message", () => {
        render(
          <StatusBar
            message={{ text: "Click a word", type: "info" }}
            paneName="Romans 8"
            paneLocked={true}
          />,
        );
        const context = screen.getByTestId("status-bar-context");
        expect(context).toHaveTextContent("Romans 8 (Annotating) —");
        expect(screen.getByTestId("status-bar")).toHaveTextContent("Click a word");
      });
    });

    describe("when paneName is provided but paneLocked is false", () => {
      it("then shows Editing in the context prefix", () => {
        render(
          <StatusBar
            message={{ text: "Some hint", type: "info" }}
            paneName="Genesis 1"
            paneLocked={false}
          />,
        );
        const context = screen.getByTestId("status-bar-context");
        expect(context).toHaveTextContent("Genesis 1 (Editing) —");
      });
    });

    describe("when paneName is provided but no message", () => {
      it("then shows just the pane context without a dash", () => {
        render(<StatusBar message={null} paneName="Psalm 23" paneLocked={true} />);
        const context = screen.getByTestId("status-bar-context");
        expect(context).toHaveTextContent("Psalm 23 (Annotating)");
        expect(context).not.toHaveTextContent("—");
      });
    });

    describe("when no paneName is provided", () => {
      it("then does not render the context prefix", () => {
        render(<StatusBar message={{ text: "Hello", type: "info" }} />);
        expect(screen.queryByTestId("status-bar-context")).not.toBeInTheDocument();
      });
    });
  });
});
