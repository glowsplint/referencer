import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { createRef } from "react";
import { Divider } from "./Divider";

function renderDivider(onResize = vi.fn(), direction?: "horizontal" | "vertical") {
  const containerRef = createRef<HTMLDivElement>();
  const { container } = render(
    <div ref={containerRef} style={{ width: 1000, height: 500 }}>
      <Divider onResize={onResize} containerRef={containerRef} direction={direction} />
    </div>,
  );
  return { onResize, containerRef, container };
}

function renderDividerWithMockedRect(onResize = vi.fn(), direction?: "horizontal" | "vertical") {
  const containerRef = createRef<HTMLDivElement>();
  const { container } = render(
    <div ref={containerRef}>
      <Divider onResize={onResize} containerRef={containerRef} direction={direction} />
    </div>,
  );

  vi.spyOn(containerRef.current!, "getBoundingClientRect").mockReturnValue({
    left: 0,
    width: 1000,
    top: 0,
    right: 1000,
    bottom: 500,
    height: 500,
    x: 0,
    y: 0,
    toJSON: () => {},
  });

  return { onResize, containerRef, container };
}

describe("Divider", () => {
  describe("when rendered in horizontal mode (default)", () => {
    it("then displays the divider element with a drag handle icon", () => {
      renderDivider();
      const divider = screen.getByTestId("divider");
      expect(divider).toBeInTheDocument();
      expect(divider.querySelector("svg")).toBeInTheDocument();
    });

    it("then renders visual separator lines on both sides of the handle", () => {
      renderDivider();
      const divider = screen.getByTestId("divider");
      // The divider has 3 children: line, icon, line
      const children = divider.children;
      expect(children.length).toBe(3);
    });
  });

  describe("when rendered in vertical mode", () => {
    it("then displays the divider element with a drag handle icon", () => {
      renderDivider(vi.fn(), "vertical");
      const divider = screen.getByTestId("divider");
      expect(divider).toBeInTheDocument();
      expect(divider.querySelector("svg")).toBeInTheDocument();
    });

    it("then renders visual separator lines on both sides of the handle", () => {
      renderDivider(vi.fn(), "vertical");
      const divider = screen.getByTestId("divider");
      const children = divider.children;
      expect(children.length).toBe(3);
    });
  });

  describe("when dragged horizontally", () => {
    it("then reports the drag position as a percentage of the container width", () => {
      const { onResize } = renderDividerWithMockedRect();
      const divider = screen.getByTestId("divider");

      fireEvent.mouseDown(divider);
      fireEvent.mouseMove(document, { clientX: 500 });
      fireEvent.mouseUp(document);

      expect(onResize).toHaveBeenCalledWith(50);
    });
  });

  describe("when dragged vertically", () => {
    it("then reports the drag position as a percentage of the container height", () => {
      const { onResize } = renderDividerWithMockedRect(vi.fn(), "vertical");
      const divider = screen.getByTestId("divider");

      fireEvent.mouseDown(divider);
      fireEvent.mouseMove(document, { clientY: 250 });
      fireEvent.mouseUp(document);

      expect(onResize).toHaveBeenCalledWith(50);
    });
  });

  describe("when dragged beyond the allowed range", () => {
    it("then clamps horizontal resize to 20-80%", () => {
      const { onResize } = renderDividerWithMockedRect();
      const divider = screen.getByTestId("divider");

      fireEvent.mouseDown(divider);

      fireEvent.mouseMove(document, { clientX: 50 });
      expect(onResize).toHaveBeenLastCalledWith(20);

      fireEvent.mouseMove(document, { clientX: 950 });
      expect(onResize).toHaveBeenLastCalledWith(80);

      fireEvent.mouseUp(document);
    });

    it("then clamps vertical resize to 20-80%", () => {
      const { onResize } = renderDividerWithMockedRect(vi.fn(), "vertical");
      const divider = screen.getByTestId("divider");

      fireEvent.mouseDown(divider);

      fireEvent.mouseMove(document, { clientY: 25 });
      expect(onResize).toHaveBeenLastCalledWith(20);

      fireEvent.mouseMove(document, { clientY: 475 });
      expect(onResize).toHaveBeenLastCalledWith(80);

      fireEvent.mouseUp(document);
    });
  });

  describe("when drag ends", () => {
    it("then restores text selection ability", () => {
      renderDivider();
      const divider = screen.getByTestId("divider");

      fireEvent.mouseDown(divider);
      expect(document.body.style.userSelect).toBe("none");

      fireEvent.mouseUp(document);
      expect(document.body.style.userSelect).toBe("");
    });
  });
});
