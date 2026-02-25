import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatusBar } from "./StatusBar";

describe("StatusBar", () => {
  describe("when no message is active", () => {
    it("shows an empty status bar", () => {
      render(<StatusBar message={null} />);
      const bar = screen.getByTestId("status-bar");
      expect(bar).toBeInTheDocument();
      expect(bar).toBeEmptyDOMElement();
    });
  });

  describe("when displaying an info message", () => {
    it("shows the message text", () => {
      render(<StatusBar message={{ text: "Click a word", type: "info" }} />);
      expect(screen.getByTestId("status-bar")).toHaveTextContent("Click a word");
    });

    it("does not show a confirmation icon", () => {
      render(<StatusBar message={{ text: "Some info", type: "info" }} />);
      expect(screen.queryByRole("img", { hidden: true })).not.toBeInTheDocument();
      // Lucide icons render as SVGs without a role — verify no SVG child exists
      const bar = screen.getByTestId("status-bar");
      expect(bar.querySelector("svg")).not.toBeInTheDocument();
    });
  });

  describe("when displaying a success message", () => {
    it("shows the message text with a confirmation icon", () => {
      render(<StatusBar message={{ text: "Arrow created", type: "success" }} />);
      const bar = screen.getByTestId("status-bar");
      expect(bar).toHaveTextContent("Arrow created");
      expect(bar.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("when the message contains rich content", () => {
    it("renders the ReactNode text and preserves inline elements", () => {
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
});
