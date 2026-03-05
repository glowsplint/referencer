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
});
