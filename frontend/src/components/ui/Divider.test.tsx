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

describe("Divider", () => {
  it("renders the divider element", () => {
    renderDivider();
    expect(screen.getByTestId("divider")).toBeInTheDocument();
  });

  it("has col-resize cursor by default", () => {
    renderDivider();
    const divider = screen.getByTestId("divider");
    expect(divider.className).toContain("cursor-col-resize");
  });

  it("has row-resize cursor when vertical", () => {
    renderDivider(vi.fn(), "vertical");
    const divider = screen.getByTestId("divider");
    expect(divider.className).toContain("cursor-row-resize");
  });

  it("renders grey fill lines on both sides of icon in horizontal mode", () => {
    renderDivider();
    const divider = screen.getByTestId("divider");
    const lines = divider.querySelectorAll(".bg-gray-300");
    expect(lines).toHaveLength(2);
    lines.forEach((line) => {
      expect(line.className).toContain("flex-1");
      expect(line.className).toContain("w-px");
    });
  });

  it("renders grey fill lines on both sides of icon in vertical mode", () => {
    renderDivider(vi.fn(), "vertical");
    const divider = screen.getByTestId("divider");
    const lines = divider.querySelectorAll(".bg-gray-300");
    expect(lines).toHaveLength(2);
    lines.forEach((line) => {
      expect(line.className).toContain("flex-1");
      expect(line.className).toContain("h-px");
    });
  });

  it("renders the icon", () => {
    renderDivider();
    const divider = screen.getByTestId("divider");
    const svg = divider.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("fires onResize during horizontal drag", () => {
    const onResize = vi.fn();
    renderDivider(onResize);
    const divider = screen.getByTestId("divider");

    fireEvent.mouseDown(divider);
    fireEvent.mouseMove(document, { clientX: 500 });
    fireEvent.mouseUp(document);

    expect(onResize).toHaveBeenCalled();
  });

  it("fires onResize during vertical drag", () => {
    const onResize = vi.fn();
    renderDivider(onResize, "vertical");
    screen.getByTestId("divider");

    const containerRef = createRef<HTMLDivElement>();
    // Re-render with a ref we can mock
    const { container } = render(
      <div ref={containerRef} style={{ width: 1000, height: 500 }}>
        <Divider onResize={onResize} containerRef={containerRef} direction="vertical" />
      </div>,
    );

    const divider2 = container.querySelector("[data-testid='divider']")!;
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

    fireEvent.mouseDown(divider2);
    fireEvent.mouseMove(document, { clientY: 250 });
    fireEvent.mouseUp(document);

    expect(onResize).toHaveBeenCalledWith(50);
  });

  it("clamps resize values to 20-80 range", () => {
    const onResize = vi.fn();
    const containerRef = createRef<HTMLDivElement>();

    render(
      <div ref={containerRef}>
        <Divider onResize={onResize} containerRef={containerRef} />
      </div>,
    );

    const divider = screen.getByTestId("divider");

    // Mock getBoundingClientRect on the container
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

    fireEvent.mouseDown(divider);

    // Move to 5% (should clamp to 20)
    fireEvent.mouseMove(document, { clientX: 50 });
    expect(onResize).toHaveBeenLastCalledWith(20);

    // Move to 95% (should clamp to 80)
    fireEvent.mouseMove(document, { clientX: 950 });
    expect(onResize).toHaveBeenLastCalledWith(80);

    fireEvent.mouseUp(document);
  });

  it("clamps vertical resize values to 20-80 range", () => {
    const onResize = vi.fn();
    const containerRef = createRef<HTMLDivElement>();

    render(
      <div ref={containerRef}>
        <Divider onResize={onResize} containerRef={containerRef} direction="vertical" />
      </div>,
    );

    const divider = screen.getByTestId("divider");

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

    fireEvent.mouseDown(divider);

    // Move to 5% (should clamp to 20)
    fireEvent.mouseMove(document, { clientY: 25 });
    expect(onResize).toHaveBeenLastCalledWith(20);

    // Move to 95% (should clamp to 80)
    fireEvent.mouseMove(document, { clientY: 475 });
    expect(onResize).toHaveBeenLastCalledWith(80);

    fireEvent.mouseUp(document);
  });

  it("restores user-select on mouseup", () => {
    renderDivider();
    const divider = screen.getByTestId("divider");

    fireEvent.mouseDown(divider);
    expect(document.body.style.userSelect).toBe("none");

    fireEvent.mouseUp(document);
    expect(document.body.style.userSelect).toBe("");
  });
});
