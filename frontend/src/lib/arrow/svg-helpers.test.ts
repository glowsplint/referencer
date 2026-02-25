import { describe, it, expect } from "vitest";
import {
  createMarkerElement,
  createArrowPath,
  createMarkerOnlyPath,
  createHoverRingPath,
  createPreviewRect,
  createPreviewArrowPath,
} from "./svg-helpers";
import type { ArrowStyleAttrs } from "@/lib/arrow-styles";

const SVG_NS = "http://www.w3.org/2000/svg";

describe("when using createMarkerElement", () => {
  it("then creates a marker with an arrowhead polygon", () => {
    const marker = createMarkerElement("test-marker", "#ff0000");
    expect(marker.tagName).toBe("marker");
    expect(marker.getAttribute("id")).toBe("test-marker");
    expect(marker.getAttribute("orient")).toBe("auto");
    expect(marker.children).toHaveLength(1);
    const polygon = marker.children[0];
    expect(polygon.tagName).toBe("polygon");
    expect(polygon.getAttribute("fill")).toBe("#ff0000");
  });

  it("then sets markerWidth and markerHeight from constants", () => {
    const marker = createMarkerElement("m", "#000");
    expect(marker.getAttribute("markerWidth")).toBe("8");
    expect(marker.getAttribute("markerHeight")).toBe("6");
    expect(marker.getAttribute("refX")).toBe("4");
    expect(marker.getAttribute("refY")).toBe("3");
  });
});

describe("when using createArrowPath", () => {
  const baseAttrs: ArrowStyleAttrs = {
    strokeDasharray: null,
    strokeWidth: 2,
    isDouble: false,
  };

  it("then creates a path with stroke color and width", () => {
    const path = createArrowPath("M 0 0 L 100 100", "#00ff00", baseAttrs);
    expect(path.tagName).toBe("path");
    expect(path.getAttribute("d")).toBe("M 0 0 L 100 100");
    expect(path.getAttribute("stroke")).toBe("#00ff00");
    expect(path.getAttribute("stroke-width")).toBe("2");
    expect(path.getAttribute("fill")).toBe("none");
  });

  it("then applies stroke-dasharray when provided in style attrs", () => {
    const dashedAttrs: ArrowStyleAttrs = {
      strokeDasharray: "8 4",
      strokeWidth: 2,
      isDouble: false,
    };
    const path = createArrowPath("M 0 0 L 50 50", "#000", dashedAttrs);
    expect(path.getAttribute("stroke-dasharray")).toBe("8 4");
  });

  it("then does not set stroke-dasharray when null", () => {
    const path = createArrowPath("M 0 0 L 50 50", "#000", baseAttrs);
    expect(path.getAttribute("stroke-dasharray")).toBeNull();
  });

  it("then sets data-testid when provided", () => {
    const path = createArrowPath("M 0 0 L 50 50", "#000", baseAttrs, {
      testId: "my-arrow",
    });
    expect(path.getAttribute("data-testid")).toBe("my-arrow");
  });

  it("then does not set data-testid when not provided", () => {
    const path = createArrowPath("M 0 0 L 50 50", "#000", baseAttrs);
    expect(path.getAttribute("data-testid")).toBeNull();
  });

  it("then sets marker-mid when markerId is provided", () => {
    const path = createArrowPath("M 0 0 L 50 50", "#000", baseAttrs, {
      markerId: "arrow-head-1",
    });
    expect(path.getAttribute("marker-mid")).toBe("url(#arrow-head-1)");
  });

  it("then does not set marker-mid when markerId is not provided", () => {
    const path = createArrowPath("M 0 0 L 50 50", "#000", baseAttrs);
    expect(path.getAttribute("marker-mid")).toBeNull();
  });
});

describe("when using createMarkerOnlyPath", () => {
  it("then creates an invisible path that carries a marker-mid", () => {
    const path = createMarkerOnlyPath("M 10 20 L 30 40", "marker-id");
    expect(path.tagName).toBe("path");
    expect(path.getAttribute("d")).toBe("M 10 20 L 30 40");
    expect(path.getAttribute("stroke")).toBe("none");
    expect(path.getAttribute("fill")).toBe("none");
    expect(path.getAttribute("marker-mid")).toBe("url(#marker-id)");
  });
});

describe("when using createHoverRingPath", () => {
  it("then creates a hover ring with normal color and opacity", () => {
    const ring = createHoverRingPath("M 0 0 L 100 100", "#3366ff", false);
    expect(ring.tagName).toBe("path");
    expect(ring.getAttribute("d")).toBe("M 0 0 L 100 100");
    expect(ring.getAttribute("stroke")).toBe("#3366ff");
    expect(ring.getAttribute("stroke-width")).toBe("6");
    expect(ring.getAttribute("stroke-opacity")).toBe("0.15");
    expect(ring.getAttribute("fill")).toBe("none");
    expect(ring.style.pointerEvents).toBe("none");
  });

  it("then uses red color and higher opacity for eraser mode", () => {
    const ring = createHoverRingPath("M 0 0 L 100 100", "#3366ff", true);
    expect(ring.getAttribute("stroke")).toBe("#ef4444");
    expect(ring.getAttribute("stroke-opacity")).toBe("0.3");
  });
});

describe("when using createPreviewRect", () => {
  it("then creates a group with a rect element", () => {
    const rect = { x: 10, y: 20, width: 100, height: 30 };
    const g = createPreviewRect(rect, "#ff0000", 0.6);
    expect(g.tagName).toBe("g");
    expect(g.getAttribute("opacity")).toBe("0.6");

    const svgRect = g.querySelector("rect");
    expect(svgRect).not.toBeNull();
    expect(svgRect!.getAttribute("data-testid")).toBe("wrapper-preview-anchor-rect");
    expect(svgRect!.getAttribute("x")).toBe("10");
    expect(svgRect!.getAttribute("y")).toBe("20");
    expect(svgRect!.getAttribute("width")).toBe("100");
    expect(svgRect!.getAttribute("height")).toBe("30");
    expect(svgRect!.getAttribute("fill")).toBe("#ff0000");
  });
});

describe("when using createPreviewArrowPath", () => {
  it("then creates a group with a dashed arrow path and marker", () => {
    const g = createPreviewArrowPath("M 0 0 L 50 50 L 100 0", "#0000ff", 0.5, "preview-marker");
    expect(g.tagName).toBe("g");
    expect(g.getAttribute("opacity")).toBe("0.5");

    const path = g.querySelector("path");
    expect(path).not.toBeNull();
    expect(path!.getAttribute("data-testid")).toBe("wrapper-preview-arrow");
    expect(path!.getAttribute("d")).toBe("M 0 0 L 50 50 L 100 0");
    expect(path!.getAttribute("stroke")).toBe("#0000ff");
    expect(path!.getAttribute("stroke-width")).toBe("2");
    expect(path!.getAttribute("stroke-dasharray")).toBe("6 4");
    expect(path!.getAttribute("fill")).toBe("none");
    expect(path!.getAttribute("marker-mid")).toBe("url(#preview-marker)");
  });
});
