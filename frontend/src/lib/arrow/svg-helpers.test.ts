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

const solidAttrs: ArrowStyleAttrs = {
  strokeDasharray: null,
  strokeWidth: 2,
  isDouble: false,
};

const dashedAttrs: ArrowStyleAttrs = {
  strokeDasharray: "8 4",
  strokeWidth: 2,
  isDouble: false,
};

describe("createMarkerElement", () => {
  describe("when called with id and color", () => {
    it("creates an SVG marker element with correct attributes", () => {
      const marker = createMarkerElement("marker-1", "#ff0000");
      expect(marker.getAttribute("id")).toBe("marker-1");
      expect(marker.getAttribute("orient")).toBe("auto");
    });

    it("contains a polygon child with the fill color", () => {
      const marker = createMarkerElement("marker-1", "#ff0000");
      const polygon = marker.querySelector("polygon");
      expect(polygon).not.toBeNull();
      expect(polygon!.getAttribute("fill")).toBe("#ff0000");
    });
  });
});

describe("createArrowPath", () => {
  describe("when called with solid style", () => {
    it("creates a path with correct d and stroke attributes", () => {
      const path = createArrowPath("M 0 0 L 100 100", "#333", solidAttrs);
      expect(path.getAttribute("d")).toBe("M 0 0 L 100 100");
      expect(path.getAttribute("stroke")).toBe("#333");
      expect(path.getAttribute("stroke-width")).toBe("2");
      expect(path.getAttribute("fill")).toBe("none");
    });

    it("does not set stroke-dasharray", () => {
      const path = createArrowPath("M 0 0 L 100 100", "#333", solidAttrs);
      expect(path.getAttribute("stroke-dasharray")).toBeNull();
    });
  });

  describe("when called with dashed style", () => {
    it("sets stroke-dasharray", () => {
      const path = createArrowPath("M 0 0 L 100 100", "#333", dashedAttrs);
      expect(path.getAttribute("stroke-dasharray")).toBe("8 4");
    });
  });

  describe("when testId is provided", () => {
    it("sets data-testid attribute", () => {
      const path = createArrowPath("M 0 0", "#333", solidAttrs, {
        testId: "my-arrow",
      });
      expect(path.getAttribute("data-testid")).toBe("my-arrow");
    });
  });

  describe("when markerId is provided", () => {
    it("sets marker-mid attribute", () => {
      const path = createArrowPath("M 0 0", "#333", solidAttrs, {
        markerId: "marker-1",
      });
      expect(path.getAttribute("marker-mid")).toBe("url(#marker-1)");
    });
  });
});

describe("createMarkerOnlyPath", () => {
  describe("when called", () => {
    it("creates an invisible path with marker-mid", () => {
      const path = createMarkerOnlyPath("M 0 0 L 50 50 L 100 0", "marker-2");
      expect(path.getAttribute("stroke")).toBe("none");
      expect(path.getAttribute("marker-mid")).toBe("url(#marker-2)");
      expect(path.getAttribute("fill")).toBe("none");
    });
  });
});

describe("createHoverRingPath", () => {
  describe("when not eraser mode", () => {
    it("uses the provided color", () => {
      const ring = createHoverRingPath("M 0 0 L 100 100", "#0066ff", false);
      expect(ring.getAttribute("stroke")).toBe("#0066ff");
      expect(ring.getAttribute("stroke-opacity")).toBe("0.15");
    });
  });

  describe("when eraser mode", () => {
    it("uses red color and higher opacity", () => {
      const ring = createHoverRingPath("M 0 0 L 100 100", "#0066ff", true);
      expect(ring.getAttribute("stroke")).toBe("#ef4444");
      expect(ring.getAttribute("stroke-opacity")).toBe("0.3");
    });
  });
});

describe("createPreviewRect", () => {
  describe("when called with rect dimensions", () => {
    it("creates a group with a rect child", () => {
      const g = createPreviewRect({ x: 10, y: 20, width: 100, height: 50 }, "#aabbcc", 0.5);
      expect(g.getAttribute("opacity")).toBe("0.5");
      const rect = g.querySelector("rect");
      expect(rect).not.toBeNull();
      expect(rect!.getAttribute("x")).toBe("10");
      expect(rect!.getAttribute("y")).toBe("20");
      expect(rect!.getAttribute("width")).toBe("100");
      expect(rect!.getAttribute("height")).toBe("50");
      expect(rect!.getAttribute("fill")).toBe("#aabbcc");
    });
  });
});

describe("createPreviewArrowPath", () => {
  describe("when called", () => {
    it("creates a group with a dashed path", () => {
      const g = createPreviewArrowPath("M 0 0 L 50 50 L 100 0", "#112233", 0.7, "preview-marker");
      expect(g.getAttribute("opacity")).toBe("0.7");
      const path = g.querySelector("path");
      expect(path).not.toBeNull();
      expect(path!.getAttribute("stroke")).toBe("#112233");
      expect(path!.getAttribute("stroke-dasharray")).toBe("6 4");
      expect(path!.getAttribute("marker-mid")).toBe("url(#preview-marker)");
    });
  });
});
