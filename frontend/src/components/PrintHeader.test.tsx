import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PrintHeader } from "./PrintHeader";
import type { Layer } from "@/types/editor";

function makeLayer(overrides: Partial<Layer> = {}): Layer {
  return {
    id: "l1",
    name: "Layer 1",
    color: "#fca5a5",
    visible: true,
    highlights: [],
    arrows: [],
    underlines: [],
    ...overrides,
  };
}

describe("PrintHeader", () => {
  it("renders the title", () => {
    render(<PrintHeader title="My Study" layers={[]} />);
    expect(screen.getByText("My Study")).toBeInTheDocument();
  });

  it("renders the current date", () => {
    const dateStr = new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    render(<PrintHeader title="Test" layers={[]} />);
    expect(screen.getByText(dateStr)).toBeInTheDocument();
  });

  it("renders layer legend with colors for visible layers", () => {
    const layers = [
      makeLayer({ id: "l1", name: "Notes", color: "#ff0000", visible: true }),
      makeLayer({ id: "l2", name: "Questions", color: "#00ff00", visible: true }),
    ];
    const { container } = render(<PrintHeader title="Test" layers={layers} />);

    expect(screen.getByText("Notes")).toBeInTheDocument();
    expect(screen.getByText("Questions")).toBeInTheDocument();

    const dots = container.querySelectorAll(".rounded-full");
    expect(dots).toHaveLength(2);
    expect((dots[0] as HTMLElement).style.backgroundColor).toBe("rgb(255, 0, 0)");
    expect((dots[1] as HTMLElement).style.backgroundColor).toBe("rgb(0, 255, 0)");
  });

  it("does not render hidden layers in the legend", () => {
    const layers = [
      makeLayer({ id: "l1", name: "Visible", visible: true }),
      makeLayer({ id: "l2", name: "Hidden", visible: false }),
    ];
    render(<PrintHeader title="Test" layers={layers} />);

    expect(screen.getByText("Visible")).toBeInTheDocument();
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });

  it("does not render layer legend when no layers are visible", () => {
    const layers = [makeLayer({ visible: false })];
    const { container } = render(<PrintHeader title="Test" layers={layers} />);
    expect(container.querySelectorAll(".rounded-full")).toHaveLength(0);
  });

  it("renders annotation counts when provided", () => {
    const counts = { comments: 3, highlights: 5, underlines: 0, connections: 2 };
    const { container } = render(
      <PrintHeader title="Test" layers={[]} annotationCounts={counts} />,
    );

    const summaryEl = container.querySelector(".print-annotation-counts");
    expect(summaryEl).toBeTruthy();
    expect(summaryEl!.textContent).toContain("3 comments");
    expect(summaryEl!.textContent).toContain("5 highlights");
    expect(summaryEl!.textContent).toContain("2 connections");
  });

  it("omits zero-count types from the summary", () => {
    const counts = { comments: 1, highlights: 0, underlines: 0, connections: 0 };
    const { container } = render(
      <PrintHeader title="Test" layers={[]} annotationCounts={counts} />,
    );

    const summaryEl = container.querySelector(".print-annotation-counts");
    expect(summaryEl).toBeTruthy();
    expect(summaryEl!.textContent).toContain("1 comment");
    expect(summaryEl!.textContent).not.toContain("highlight");
    expect(summaryEl!.textContent).not.toContain("underline");
    expect(summaryEl!.textContent).not.toContain("connection");
  });

  it("does not render annotation counts when all are zero", () => {
    const counts = { comments: 0, highlights: 0, underlines: 0, connections: 0 };
    const { container } = render(
      <PrintHeader title="Test" layers={[]} annotationCounts={counts} />,
    );

    expect(container.querySelector(".print-annotation-counts")).toBeNull();
  });

  it("does not render annotation counts when not provided", () => {
    const { container } = render(<PrintHeader title="Test" layers={[]} />);
    expect(container.querySelector(".print-annotation-counts")).toBeNull();
  });

  it("uses singular form for count of 1", () => {
    const counts = { comments: 1, highlights: 1, underlines: 1, connections: 1 };
    const { container } = render(
      <PrintHeader title="Test" layers={[]} annotationCounts={counts} />,
    );

    const summaryEl = container.querySelector(".print-annotation-counts");
    expect(summaryEl!.textContent).toContain("1 comment");
    expect(summaryEl!.textContent).toContain("1 highlight");
    expect(summaryEl!.textContent).toContain("1 underline");
    expect(summaryEl!.textContent).toContain("1 connection");
    // Ensure no plural forms
    expect(summaryEl!.textContent).not.toContain("comments");
    expect(summaryEl!.textContent).not.toContain("highlights");
    expect(summaryEl!.textContent).not.toContain("underlines");
    expect(summaryEl!.textContent).not.toContain("connections");
  });
});
