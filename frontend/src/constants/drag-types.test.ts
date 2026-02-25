import { describe, it, expect } from "vitest";
import { DRAG_TYPE_LAYER, DRAG_TYPE_SECTION } from "./drag-types";

describe("when using drag-types constants", () => {
  it("then exports DRAG_TYPE_LAYER as the layer MIME type", () => {
    expect(DRAG_TYPE_LAYER).toBe("application/x-layer-id");
  });

  it("then exports DRAG_TYPE_SECTION as the section MIME type", () => {
    expect(DRAG_TYPE_SECTION).toBe("application/x-section-index");
  });
});
