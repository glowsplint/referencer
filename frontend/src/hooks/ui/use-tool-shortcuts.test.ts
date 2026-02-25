import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useToolShortcuts } from "./use-tool-shortcuts";

function fireKeyDown(code: string, options: Partial<KeyboardEvent> = {}) {
  const { repeat = false, ...rest } = options;
  document.dispatchEvent(new KeyboardEvent("keydown", { code, repeat, ...rest }));
}

describe("useToolShortcuts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("when S is pressed, then sets selection tool", () => {
    const setActiveTool = vi.fn();
    renderHook(() => useToolShortcuts({ isLocked: true, setActiveTool }));

    act(() => {
      fireKeyDown("KeyS");
    });
    expect(setActiveTool).toHaveBeenCalledWith("selection");
  });

  it("when A is pressed, then sets arrow tool", () => {
    const setActiveTool = vi.fn();
    renderHook(() => useToolShortcuts({ isLocked: true, setActiveTool }));

    act(() => {
      fireKeyDown("KeyA");
    });
    expect(setActiveTool).toHaveBeenCalledWith("arrow");
  });

  it("when C is pressed, then sets comments tool", () => {
    const setActiveTool = vi.fn();
    renderHook(() => useToolShortcuts({ isLocked: true, setActiveTool }));

    act(() => {
      fireKeyDown("KeyC");
    });
    expect(setActiveTool).toHaveBeenCalledWith("comments");
  });

  it("when isLocked is false, then does nothing", () => {
    const setActiveTool = vi.fn();
    renderHook(() => useToolShortcuts({ isLocked: false, setActiveTool }));

    act(() => {
      fireKeyDown("KeyA");
    });
    expect(setActiveTool).not.toHaveBeenCalled();
  });

  it("when a repeat keydown event fires, then ignores it", () => {
    const setActiveTool = vi.fn();
    renderHook(() => useToolShortcuts({ isLocked: true, setActiveTool }));

    act(() => {
      fireKeyDown("KeyA", { repeat: true });
    });
    expect(setActiveTool).not.toHaveBeenCalled();
  });

  it("when an unrelated key is pressed, then ignores it", () => {
    const setActiveTool = vi.fn();
    renderHook(() => useToolShortcuts({ isLocked: true, setActiveTool }));

    act(() => {
      fireKeyDown("KeyB");
    });
    act(() => {
      fireKeyDown("KeyX");
    });
    expect(setActiveTool).not.toHaveBeenCalled();
  });

  it.each([
    { modifier: "metaKey" },
    { modifier: "ctrlKey" },
    { modifier: "altKey" },
    { modifier: "shiftKey" },
  ])("ignores shortcut when $modifier is held", ({ modifier }) => {
    const setActiveTool = vi.fn();
    renderHook(() => useToolShortcuts({ isLocked: true, setActiveTool }));

    act(() => {
      fireKeyDown("KeyS", { [modifier]: true });
    });
    expect(setActiveTool).not.toHaveBeenCalled();
  });

  it("when key is pressed on an editable element, then ignores it", () => {
    const setActiveTool = vi.fn();
    renderHook(() => useToolShortcuts({ isLocked: true, setActiveTool }));

    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    textarea.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyA", bubbles: true }));
    document.body.removeChild(textarea);

    expect(setActiveTool).not.toHaveBeenCalled();
  });

  it("when isLocked changes to true, then starts listening", () => {
    const setActiveTool = vi.fn();
    const { rerender } = renderHook(
      (props: { isLocked: boolean }) =>
        useToolShortcuts({ isLocked: props.isLocked, setActiveTool }),
      { initialProps: { isLocked: false } },
    );

    act(() => {
      fireKeyDown("KeyA");
    });
    expect(setActiveTool).not.toHaveBeenCalled();

    rerender({ isLocked: true });

    act(() => {
      fireKeyDown("KeyA");
    });
    expect(setActiveTool).toHaveBeenCalledWith("arrow");
  });
});
