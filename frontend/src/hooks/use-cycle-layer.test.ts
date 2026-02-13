import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useCycleLayer } from "./use-cycle-layer";
import type { Layer } from "@/types/editor";

function makeLayers(count: number): Layer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `layer-${i}`,
    name: `Layer ${i + 1}`,
    color: `#${i}${i}${i}`,
    visible: true,
    highlights: [],
    arrows: [],
  }));
}

function pressKey(code: string, options: Partial<KeyboardEvent> = {}) {
  document.dispatchEvent(
    new KeyboardEvent("keydown", { code, bubbles: true, ...options })
  );
}

describe("useCycleLayer", () => {
  it("cycles to next layer on L key press", () => {
    const layers = makeLayers(3);
    const setActiveLayer = vi.fn();
    renderHook(() =>
      useCycleLayer({
        layers,
        activeLayerId: "layer-0",
        setActiveLayer,
      })
    );

    pressKey("KeyL");
    expect(setActiveLayer).toHaveBeenCalledWith("layer-1");
  });

  it("wraps around to first layer when at last", () => {
    const layers = makeLayers(3);
    const setActiveLayer = vi.fn();
    renderHook(() =>
      useCycleLayer({
        layers,
        activeLayerId: "layer-2",
        setActiveLayer,
      })
    );

    pressKey("KeyL");
    expect(setActiveLayer).toHaveBeenCalledWith("layer-0");
  });

  it("selects first layer when no active layer", () => {
    const layers = makeLayers(3);
    const setActiveLayer = vi.fn();
    renderHook(() =>
      useCycleLayer({
        layers,
        activeLayerId: null,
        setActiveLayer,
      })
    );

    pressKey("KeyL");
    expect(setActiveLayer).toHaveBeenCalledWith("layer-0");
  });

  it("does nothing when there are no layers", () => {
    const setActiveLayer = vi.fn();
    renderHook(() =>
      useCycleLayer({
        layers: [],
        activeLayerId: null,
        setActiveLayer,
      })
    );

    pressKey("KeyL");
    expect(setActiveLayer).not.toHaveBeenCalled();
  });

  it("ignores repeat keydown events", () => {
    const layers = makeLayers(3);
    const setActiveLayer = vi.fn();
    renderHook(() =>
      useCycleLayer({
        layers,
        activeLayerId: "layer-0",
        setActiveLayer,
      })
    );

    pressKey("KeyL", { repeat: true });
    expect(setActiveLayer).not.toHaveBeenCalled();
  });

  it("ignores non-L key presses", () => {
    const layers = makeLayers(3);
    const setActiveLayer = vi.fn();
    renderHook(() =>
      useCycleLayer({
        layers,
        activeLayerId: "layer-0",
        setActiveLayer,
      })
    );

    pressKey("KeyA");
    expect(setActiveLayer).not.toHaveBeenCalled();
  });

  it.each([
    { modifier: "metaKey" },
    { modifier: "ctrlKey" },
    { modifier: "altKey" },
    { modifier: "shiftKey" },
  ])("ignores L key when $modifier is held", ({ modifier }) => {
    const layers = makeLayers(3);
    const setActiveLayer = vi.fn();
    renderHook(() =>
      useCycleLayer({
        layers,
        activeLayerId: "layer-0",
        setActiveLayer,
      })
    );

    pressKey("KeyL", { [modifier]: true });
    expect(setActiveLayer).not.toHaveBeenCalled();
  });

  it("ignores L key when target is contentEditable", () => {
    const layers = makeLayers(3);
    const setActiveLayer = vi.fn();
    renderHook(() =>
      useCycleLayer({
        layers,
        activeLayerId: "layer-0",
        setActiveLayer,
      })
    );

    const editableDiv = document.createElement("div");
    editableDiv.contentEditable = "true";
    document.body.appendChild(editableDiv);
    editableDiv.dispatchEvent(
      new KeyboardEvent("keydown", { code: "KeyL", bubbles: true })
    );
    document.body.removeChild(editableDiv);

    expect(setActiveLayer).not.toHaveBeenCalled();
  });
});
