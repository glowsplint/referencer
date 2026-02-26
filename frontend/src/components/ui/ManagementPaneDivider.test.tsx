import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { ManagementPaneDivider } from "./ManagementPaneDivider";
import { ManagementPane } from "../ManagementPane";
import { renderWithWorkspace } from "@/test/render-with-workspace";

function renderDivider(width = 250, onResize = vi.fn(), onResizeEnd = vi.fn()) {
  render(<ManagementPaneDivider width={width} onResize={onResize} onResizeEnd={onResizeEnd} />);
  return { onResize, onResizeEnd };
}

afterEach(() => {
  document.body.style.userSelect = "";
});

describe("ManagementPaneDivider", () => {
  describe("when rendered", () => {
    it("then displays the divider with the correct test id", () => {
      renderDivider();
      expect(screen.getByTestId("management-pane-divider")).toBeInTheDocument();
    });
  });

  describe("when mousedown + mousemove right + mouseup", () => {
    it("then onResize is called with increased width", () => {
      const { onResize } = renderDivider(250);
      const divider = screen.getByTestId("management-pane-divider");

      fireEvent.mouseDown(divider, { clientX: 250 });
      fireEvent.mouseMove(document, { clientX: 350 });
      fireEvent.mouseUp(document);

      expect(onResize).toHaveBeenCalledWith(350);
    });
  });

  describe("when mousedown + mousemove left + mouseup", () => {
    it("then onResize is called with decreased width", () => {
      const { onResize } = renderDivider(300);
      const divider = screen.getByTestId("management-pane-divider");

      fireEvent.mouseDown(divider, { clientX: 300 });
      fireEvent.mouseMove(document, { clientX: 220 });
      fireEvent.mouseUp(document);

      expect(onResize).toHaveBeenCalledWith(220);
    });
  });

  describe("when dragged beyond max (500px)", () => {
    it("then width is clamped to 500", () => {
      const { onResize } = renderDivider(400);
      const divider = screen.getByTestId("management-pane-divider");

      fireEvent.mouseDown(divider, { clientX: 400 });
      fireEvent.mouseMove(document, { clientX: 700 });

      expect(onResize).toHaveBeenLastCalledWith(500);

      fireEvent.mouseUp(document);
    });
  });

  describe("when dragged below min (150px)", () => {
    it("then width is clamped to 150", () => {
      const { onResize } = renderDivider(250);
      const divider = screen.getByTestId("management-pane-divider");

      fireEvent.mouseDown(divider, { clientX: 250 });
      fireEvent.mouseMove(document, { clientX: 50 });

      expect(onResize).toHaveBeenLastCalledWith(150);

      fireEvent.mouseUp(document);
    });
  });

  describe("when mouseup fires", () => {
    it("then onResizeEnd is called with final width", () => {
      const { onResizeEnd } = renderDivider(250);
      const divider = screen.getByTestId("management-pane-divider");

      fireEvent.mouseDown(divider, { clientX: 250 });
      fireEvent.mouseMove(document, { clientX: 350 });
      fireEvent.mouseUp(document);

      expect(onResizeEnd).toHaveBeenCalledWith(350);
    });
  });

  describe("when dragging", () => {
    it("then document.body.style.userSelect is set to 'none'", () => {
      renderDivider();
      const divider = screen.getByTestId("management-pane-divider");

      fireEvent.mouseDown(divider, { clientX: 250 });

      expect(document.body.style.userSelect).toBe("none");

      fireEvent.mouseUp(document);
    });
  });

  describe("when mouseup fires after dragging", () => {
    it("then document.body.style.userSelect is restored to ''", () => {
      renderDivider();
      const divider = screen.getByTestId("management-pane-divider");

      fireEvent.mouseDown(divider, { clientX: 250 });
      expect(document.body.style.userSelect).toBe("none");

      fireEvent.mouseUp(document);
      expect(document.body.style.userSelect).toBe("");
    });
  });
});

describe("ManagementPane width prop", () => {
  describe("when width prop is provided", () => {
    it("then it applies as inline style", () => {
      renderWithWorkspace(<ManagementPane width={320} />);
      const pane = screen.getByTestId("managementPane");
      expect(pane.style.width).toBe("320px");
    });
  });

  describe("when no width prop is provided", () => {
    it("then it defaults to 250px", () => {
      renderWithWorkspace(<ManagementPane />);
      const pane = screen.getByTestId("managementPane");
      expect(pane.style.width).toBe("250px");
    });
  });
});
