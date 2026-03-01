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
    underlines: [],
  }));
}

function pressKey(key: string, options: Partial<KeyboardEvent> = {}) {
  document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...options }));
}

describe("useCycleLayer", () => {
  it("when ] key is pressed, then cycles to next layer", () => {
    const layers = makeLayers(3);
    const setActiveLayer = vi.fn();
    renderHook(() =>
      useCycleLayer({
        layers,
        activeLayerId: "layer-0",
        setActiveLayer,
      }),
    );

    pressKey("]");
    expect(setActiveLayer).toHaveBeenCalledWith("layer-1");
  });

  it("when at last layer and ] is pressed, then wraps to first layer", () => {
    const layers = makeLayers(3);
    const setActiveLayer = vi.fn();
    renderHook(() =>
      useCycleLayer({
        layers,
        activeLayerId: "layer-2",
        setActiveLayer,
      }),
    );

    pressKey("]");
    expect(setActiveLayer).toHaveBeenCalledWith("layer-0");
  });

  it("when no active layer and ] is pressed, then selects first layer", () => {
    const layers = makeLayers(3);
    const setActiveLayer = vi.fn();
    renderHook(() =>
      useCycleLayer({
        layers,
        activeLayerId: null,
        setActiveLayer,
      }),
    );

    pressKey("]");
    expect(setActiveLayer).toHaveBeenCalledWith("layer-0");
  });

  it("when [ is pressed, then cycles to previous layer", () => {
    const layers = makeLayers(3);
    const setActiveLayer = vi.fn();
    renderHook(() =>
      useCycleLayer({
        layers,
        activeLayerId: "layer-1",
        setActiveLayer,
      }),
    );

    pressKey("[");
    expect(setActiveLayer).toHaveBeenCalledWith("layer-0");
  });

  it("when at first layer and [ is pressed, then wraps to last layer", () => {
    const layers = makeLayers(3);
    const setActiveLayer = vi.fn();
    renderHook(() =>
      useCycleLayer({
        layers,
        activeLayerId: "layer-0",
        setActiveLayer,
      }),
    );

    pressKey("[");
    expect(setActiveLayer).toHaveBeenCalledWith("layer-2");
  });

  it("when there are no layers, then does nothing", () => {
    const setActiveLayer = vi.fn();
    renderHook(() =>
      useCycleLayer({
        layers: [],
        activeLayerId: null,
        setActiveLayer,
      }),
    );

    pressKey("]");
    expect(setActiveLayer).not.toHaveBeenCalled();
  });

  it("when a repeat keydown event fires, then ignores it", () => {
    const layers = makeLayers(3);
    const setActiveLayer = vi.fn();
    renderHook(() =>
      useCycleLayer({
        layers,
        activeLayerId: "layer-0",
        setActiveLayer,
      }),
    );

    pressKey("]", { repeat: true });
    expect(setActiveLayer).not.toHaveBeenCalled();
  });

  it("when a non-bracket key is pressed, then ignores it", () => {
    const layers = makeLayers(3);
    const setActiveLayer = vi.fn();
    renderHook(() =>
      useCycleLayer({
        layers,
        activeLayerId: "layer-0",
        setActiveLayer,
      }),
    );

    pressKey("a");
    expect(setActiveLayer).not.toHaveBeenCalled();
  });

  it.each([{ modifier: "metaKey" }, { modifier: "ctrlKey" }, { modifier: "altKey" }])(
    "ignores ] when $modifier is held",
    ({ modifier }) => {
      const layers = makeLayers(3);
      const setActiveLayer = vi.fn();
      renderHook(() =>
        useCycleLayer({
          layers,
          activeLayerId: "layer-0",
          setActiveLayer,
        }),
      );

      pressKey("]", { [modifier]: true });
      expect(setActiveLayer).not.toHaveBeenCalled();
    },
  );

  it("when ] is pressed on a contentEditable target, then ignores it", () => {
    const layers = makeLayers(3);
    const setActiveLayer = vi.fn();
    renderHook(() =>
      useCycleLayer({
        layers,
        activeLayerId: "layer-0",
        setActiveLayer,
      }),
    );

    const editableDiv = document.createElement("div");
    editableDiv.contentEditable = "true";
    document.body.appendChild(editableDiv);
    editableDiv.dispatchEvent(new KeyboardEvent("keydown", { key: "]", bubbles: true }));
    document.body.removeChild(editableDiv);

    expect(setActiveLayer).not.toHaveBeenCalled();
  });

  it("ignores ] when shiftKey is held", () => {
    const layers = makeLayers(3);
    const setActiveLayer = vi.fn();
    renderHook(() =>
      useCycleLayer({
        layers,
        activeLayerId: "layer-0",
        setActiveLayer,
      }),
    );

    pressKey("]", { shiftKey: true });
    expect(setActiveLayer).not.toHaveBeenCalled();
  });
});
