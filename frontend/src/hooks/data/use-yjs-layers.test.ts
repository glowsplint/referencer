import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as Y from "yjs";
import { useYjsLayers } from "./use-yjs-layers";
import { TAILWIND_300_COLORS } from "@/constants/colors";
import { addLayerToDoc, getLayersArray } from "@/lib/yjs/annotations";

vi.mock("sonner", () => ({
  toast: {
    warning: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/i18n", () => ({
  default: { t: (key: string) => key },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useYjsLayers", () => {
  it("reads layers on mount from a pre-seeded doc", async () => {
    const doc = new Y.Doc();
    addLayerToDoc(doc, { id: "l1", name: "Layer 1", color: "#fca5a5" });

    const { result } = renderHook(() => useYjsLayers(doc));

    await vi.waitFor(() => {
      expect(result.current.layers).toHaveLength(1);
    });
    expect(result.current.layers[0].id).toBe("l1");
    expect(result.current.layers[0].name).toBe("Layer 1");
    expect(result.current.layers[0].color).toBe("#fca5a5");
  });

  it("addLayer picks the first unused color from TAILWIND_300_COLORS", async () => {
    const doc = new Y.Doc();
    const { result } = renderHook(() => useYjsLayers(doc));

    act(() => {
      result.current.addLayer();
    });

    await vi.waitFor(() => {
      expect(result.current.layers).toHaveLength(1);
    });
    expect(result.current.layers[0].color).toBe(TAILWIND_300_COLORS[0]);
  });

  it("addLayer returns null and shows toast when all colors are used", async () => {
    const { toast } = await import("sonner");
    const doc = new Y.Doc();
    const { result } = renderHook(() => useYjsLayers(doc));

    // Fill all colors
    act(() => {
      for (let i = 0; i < TAILWIND_300_COLORS.length; i++) {
        result.current.addLayer({ color: TAILWIND_300_COLORS[i] });
      }
    });

    await vi.waitFor(() => {
      expect(result.current.layers).toHaveLength(TAILWIND_300_COLORS.length);
    });

    let ret: ReturnType<typeof result.current.addLayer>;
    act(() => {
      ret = result.current.addLayer();
    });

    expect(ret!).toBeNull();
    expect(toast.warning).toHaveBeenCalled();
  });

  it("removeLayer clears activeLayerId if removed layer was active", async () => {
    const doc = new Y.Doc();
    const { result } = renderHook(() => useYjsLayers(doc));

    act(() => {
      result.current.addLayer({ id: "l1" });
    });

    await vi.waitFor(() => {
      expect(result.current.layers).toHaveLength(1);
    });
    expect(result.current.activeLayerId).toBe("l1");

    act(() => {
      result.current.removeLayer("l1");
    });

    await vi.waitFor(() => {
      expect(result.current.layers).toHaveLength(0);
    });
    expect(result.current.activeLayerId).toBeNull();
  });

  it("removeLayer keeps activeLayerId when a different layer is removed", async () => {
    const doc = new Y.Doc();
    const { result } = renderHook(() => useYjsLayers(doc));

    act(() => {
      result.current.addLayer({ id: "l1" });
    });
    act(() => {
      result.current.addLayer({ id: "l2" });
    });

    await vi.waitFor(() => {
      expect(result.current.layers).toHaveLength(2);
    });

    // l2 should be active (last added)
    expect(result.current.activeLayerId).toBe("l2");

    act(() => {
      result.current.removeLayer("l1");
    });

    await vi.waitFor(() => {
      expect(result.current.layers).toHaveLength(1);
    });
    expect(result.current.activeLayerId).toBe("l2");
  });

  it("setActiveLayer updates activeLayerId", async () => {
    const doc = new Y.Doc();
    const { result } = renderHook(() => useYjsLayers(doc));

    act(() => {
      result.current.addLayer({ id: "l1" });
    });
    act(() => {
      result.current.addLayer({ id: "l2" });
    });

    await vi.waitFor(() => {
      expect(result.current.layers).toHaveLength(2);
    });

    act(() => {
      result.current.setActiveLayer("l1");
    });

    expect(result.current.activeLayerId).toBe("l1");
  });

  it("auto-selects first layer when layers exist but activeLayerId is null", async () => {
    const doc = new Y.Doc();
    // Pre-seed a layer before hook mounts
    addLayerToDoc(doc, { id: "l1", name: "Layer 1", color: "#fca5a5" });

    const { result } = renderHook(() => useYjsLayers(doc));

    await vi.waitFor(() => {
      expect(result.current.layers).toHaveLength(1);
      expect(result.current.activeLayerId).toBe("l1");
    });
  });

  it("reacts to external Y.Doc mutations", async () => {
    const doc = new Y.Doc();
    const { result } = renderHook(() => useYjsLayers(doc));

    // Initially empty
    expect(result.current.layers).toHaveLength(0);

    // Add layer externally (simulating another user)
    act(() => {
      addLayerToDoc(doc, { id: "external-1", name: "External Layer", color: "#86efac" });
    });

    await vi.waitFor(() => {
      expect(result.current.layers).toHaveLength(1);
    });
    expect(result.current.layers[0].id).toBe("external-1");
    expect(result.current.layers[0].name).toBe("External Layer");
  });

  it("all mutation methods are no-ops when doc is null", () => {
    const { result } = renderHook(() => useYjsLayers(null));

    // These should not throw
    act(() => {
      const addResult = result.current.addLayer();
      expect(addResult).toBeNull();

      result.current.removeLayer("l1");
      result.current.setActiveLayer("l1");
      result.current.updateLayerColor("l1", "#000");
      result.current.updateLayerName("l1", "test");
      result.current.toggleLayerVisibility("l1");
      result.current.toggleAllLayerVisibility();

      const highlightId = result.current.addHighlight("l1", {
        editorIndex: 0,
        from: 1,
        to: 5,
        text: "hello",
        type: "comment",
        annotation: "",
      });
      expect(highlightId).toBe("");

      result.current.removeHighlight("l1", "h1");
      result.current.clearLayerHighlights("l1");
      result.current.updateHighlightAnnotation("l1", "h1", "note");

      const arrowId = result.current.addArrow("l1", {
        from: { editorIndex: 0, from: 1, to: 5, text: "hello" },
        to: { editorIndex: 0, from: 10, to: 15, text: "world" },
      });
      expect(arrowId).toBe("");

      result.current.removeArrow("l1", "a1");
      result.current.clearLayerArrows("l1");
      result.current.updateArrowStyle("l1", "a1", "dashed");

      const underlineId = result.current.addUnderline("l1", {
        editorIndex: 0,
        from: 1,
        to: 5,
        text: "hello",
      });
      expect(underlineId).toBe("");

      result.current.removeUnderline("l1", "u1");
      result.current.clearLayerUnderlines("l1");
      result.current.toggleHighlightVisibility("l1", "h1");
      result.current.toggleArrowVisibility("l1", "a1");
      result.current.toggleUnderlineVisibility("l1", "u1");
      result.current.addReply("l1", "h1", {
        id: "r1",
        text: "reply",
        userName: "user",
        timestamp: 0,
      });
      result.current.updateReply("l1", "h1", "r1", "new text");
      result.current.removeReply("l1", "h1", "r1");
      result.current.toggleReactionOnHighlight("l1", "h1", "👍", "user");
      result.current.toggleReactionOnReply("l1", "h1", "r1", "👍", "user");
    });

    expect(result.current.layers).toEqual([]);
  });

  it("setLayers is a no-op that logs a console warning", () => {
    const doc = new Y.Doc();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { result } = renderHook(() => useYjsLayers(doc));

    act(() => {
      result.current.setLayers([]);
    });

    expect(warnSpy).toHaveBeenCalledWith(
      "[yjs-layers] setLayers called but ignored in CRDT mode",
    );
    warnSpy.mockRestore();
  });

  it("addLayer returns id and name", async () => {
    const doc = new Y.Doc();
    const { result } = renderHook(() => useYjsLayers(doc));

    let ret: ReturnType<typeof result.current.addLayer>;
    act(() => {
      ret = result.current.addLayer();
    });

    expect(ret!).not.toBeNull();
    expect(ret!.id).toBeTruthy();
    expect(ret!.name).toBe("Layer 1");
  });

  it("addLayer with explicit id and name uses them", async () => {
    const doc = new Y.Doc();
    const { result } = renderHook(() => useYjsLayers(doc));

    act(() => {
      result.current.addLayer({ id: "custom-id", name: "Custom Name", color: "#fca5a5" });
    });

    await vi.waitFor(() => {
      expect(result.current.layers).toHaveLength(1);
    });
    expect(result.current.layers[0].id).toBe("custom-id");
    expect(result.current.layers[0].name).toBe("Custom Name");
  });

  it("addLayer with explicit name does not increment counter", async () => {
    const doc = new Y.Doc();
    const { result } = renderHook(() => useYjsLayers(doc));

    act(() => {
      result.current.addLayer({ name: "Custom" });
    });
    act(() => {
      result.current.addLayer();
    });

    await vi.waitFor(() => {
      expect(result.current.layers).toHaveLength(2);
    });
    expect(result.current.layers[0].name).toBe("Custom");
    expect(result.current.layers[1].name).toBe("Layer 1");
  });

  it("addLayer sets the new layer as active", async () => {
    const doc = new Y.Doc();
    const { result } = renderHook(() => useYjsLayers(doc));

    act(() => {
      result.current.addLayer({ id: "l1" });
    });
    act(() => {
      result.current.addLayer({ id: "l2" });
    });

    expect(result.current.activeLayerId).toBe("l2");
  });

  it("addLayer picks next unused color when first colors are taken", async () => {
    const doc = new Y.Doc();
    const { result } = renderHook(() => useYjsLayers(doc));

    act(() => {
      result.current.addLayer({ color: TAILWIND_300_COLORS[0] });
    });
    act(() => {
      result.current.addLayer();
    });

    await vi.waitFor(() => {
      expect(result.current.layers).toHaveLength(2);
    });
    expect(result.current.layers[1].color).toBe(TAILWIND_300_COLORS[1]);
  });

  it("updateLayerName changes a layer's name in the doc", async () => {
    const doc = new Y.Doc();
    const { result } = renderHook(() => useYjsLayers(doc));

    act(() => {
      result.current.addLayer({ id: "l1", name: "Original" });
    });

    await vi.waitFor(() => {
      expect(result.current.layers).toHaveLength(1);
    });

    act(() => {
      result.current.updateLayerName("l1", "Renamed");
    });

    await vi.waitFor(() => {
      expect(result.current.layers[0].name).toBe("Renamed");
    });
  });

  it("updateLayerColor changes a layer's color in the doc", async () => {
    const doc = new Y.Doc();
    const { result } = renderHook(() => useYjsLayers(doc));

    act(() => {
      result.current.addLayer({ id: "l1" });
    });

    await vi.waitFor(() => {
      expect(result.current.layers).toHaveLength(1);
    });

    act(() => {
      result.current.updateLayerColor("l1", "#000000");
    });

    await vi.waitFor(() => {
      expect(result.current.layers[0].color).toBe("#000000");
    });
  });

  it("toggleLayerVisibility toggles a layer's visibility", async () => {
    const doc = new Y.Doc();
    const { result } = renderHook(() => useYjsLayers(doc));

    act(() => {
      result.current.addLayer({ id: "l1" });
    });

    await vi.waitFor(() => {
      expect(result.current.layers[0].visible).toBe(true);
    });

    act(() => {
      result.current.toggleLayerVisibility("l1");
    });

    await vi.waitFor(() => {
      expect(result.current.layers[0].visible).toBe(false);
    });

    act(() => {
      result.current.toggleLayerVisibility("l1");
    });

    await vi.waitFor(() => {
      expect(result.current.layers[0].visible).toBe(true);
    });
  });

  it("toggleAllLayerVisibility hides all layers when any are visible", async () => {
    const doc = new Y.Doc();
    const { result } = renderHook(() => useYjsLayers(doc));

    act(() => {
      result.current.addLayer({ id: "l1" });
      result.current.addLayer({ id: "l2" });
    });

    await vi.waitFor(() => {
      expect(result.current.layers).toHaveLength(2);
    });

    act(() => {
      result.current.toggleAllLayerVisibility();
    });

    await vi.waitFor(() => {
      expect(result.current.layers[0].visible).toBe(false);
      expect(result.current.layers[1].visible).toBe(false);
    });
  });

  it("toggleAllLayerVisibility shows all layers when none are visible", async () => {
    const doc = new Y.Doc();
    const { result } = renderHook(() => useYjsLayers(doc));

    act(() => {
      result.current.addLayer({ id: "l1" });
      result.current.addLayer({ id: "l2" });
    });

    await vi.waitFor(() => {
      expect(result.current.layers).toHaveLength(2);
    });

    // Hide all
    act(() => {
      result.current.toggleLayerVisibility("l1");
      result.current.toggleLayerVisibility("l2");
    });

    await vi.waitFor(() => {
      expect(result.current.layers[0].visible).toBe(false);
      expect(result.current.layers[1].visible).toBe(false);
    });

    // Toggle all -- should show all
    act(() => {
      result.current.toggleAllLayerVisibility();
    });

    await vi.waitFor(() => {
      expect(result.current.layers[0].visible).toBe(true);
      expect(result.current.layers[1].visible).toBe(true);
    });
  });

  it("addLayer with extraColors extends the palette", async () => {
    const doc = new Y.Doc();
    const { result } = renderHook(() => useYjsLayers(doc));

    // Fill all standard colors
    act(() => {
      for (const color of TAILWIND_300_COLORS) {
        result.current.addLayer({ color });
      }
    });

    await vi.waitFor(() => {
      expect(result.current.layers).toHaveLength(TAILWIND_300_COLORS.length);
    });

    // Now add with extra colors
    act(() => {
      result.current.addLayer({ extraColors: ["#custom1", "#custom2"] });
    });

    await vi.waitFor(() => {
      expect(result.current.layers).toHaveLength(TAILWIND_300_COLORS.length + 1);
    });
    expect(result.current.layers[result.current.layers.length - 1].color).toBe("#custom1");
  });

  it("returns empty layers array when doc is null", () => {
    const { result } = renderHook(() => useYjsLayers(null));
    expect(result.current.layers).toEqual([]);
    expect(result.current.activeLayerId).toBeNull();
  });

  it("layer name counter increments across multiple adds", async () => {
    const doc = new Y.Doc();
    const { result } = renderHook(() => useYjsLayers(doc));

    act(() => {
      result.current.addLayer();
    });
    act(() => {
      result.current.addLayer();
    });
    act(() => {
      result.current.addLayer();
    });

    await vi.waitFor(() => {
      expect(result.current.layers).toHaveLength(3);
    });
    expect(result.current.layers[0].name).toBe("Layer 1");
    expect(result.current.layers[1].name).toBe("Layer 2");
    expect(result.current.layers[2].name).toBe("Layer 3");
  });
});
