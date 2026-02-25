import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ArrowStylePicker } from "./ArrowStylePicker";
import { ARROW_STYLES } from "@/lib/arrow-styles";

function renderPicker(overrides = {}) {
  const defaults = {
    index: 0,
    activeStyle: "solid" as const,
    color: "#fca5a5",
    onSelectStyle: vi.fn(),
  };
  const props = { ...defaults, ...overrides };
  return { ...render(<ArrowStylePicker {...props} />), props };
}

describe("ArrowStylePicker", () => {
  describe("when rendered", () => {
    it("shows all arrow style options with labels", () => {
      renderPicker();
      for (const style of ARROW_STYLES) {
        expect(screen.getByTestId(`arrowStyleOption-${style.value}`)).toBeInTheDocument();
        expect(screen.getByText(style.label)).toBeInTheDocument();
      }
    });

    it("renders an SVG preview for each style", () => {
      const { container } = renderPicker();
      const svgs = container.querySelectorAll("svg");
      expect(svgs.length).toBe(ARROW_STYLES.length);
    });

    it("uses the provided index in the testid", () => {
      renderPicker({ index: 3 });
      expect(screen.getByTestId("arrowStylePicker-3")).toBeInTheDocument();
    });
  });

  describe("when a style option is clicked", () => {
    it("calls onSelectStyle with the dotted style", () => {
      const { props } = renderPicker();
      fireEvent.click(screen.getByTestId("arrowStyleOption-dotted"));
      expect(props.onSelectStyle).toHaveBeenCalledWith("dotted");
    });

    it("calls onSelectStyle with the double style", () => {
      const { props } = renderPicker();
      fireEvent.click(screen.getByTestId("arrowStyleOption-double"));
      expect(props.onSelectStyle).toHaveBeenCalledWith("double");
    });
  });
});
