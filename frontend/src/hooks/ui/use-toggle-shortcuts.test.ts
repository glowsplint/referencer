import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useToggleShortcuts } from "./use-toggle-shortcuts";

function fireKeyDown(code: string, options: Partial<KeyboardEvent> = {}) {
  const { repeat = false, ...rest } = options;
  document.dispatchEvent(new KeyboardEvent("keydown", { code, repeat, ...rest }));
}

function makeCallbacks() {
  return {
    toggleDarkMode: vi.fn(),
    toggleMultipleRowsLayout: vi.fn(),
    toggleLocked: vi.fn(),
    toggleManagementPane: vi.fn(),
  };
}

describe("useToggleShortcuts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("when D is pressed, then toggles dark mode", () => {
    const callbacks = makeCallbacks();
    renderHook(() => useToggleShortcuts(callbacks));

    act(() => {
      fireKeyDown("KeyD");
    });
    expect(callbacks.toggleDarkMode).toHaveBeenCalledOnce();
  });

  it("when R is pressed, then toggles layout", () => {
    const callbacks = makeCallbacks();
    renderHook(() => useToggleShortcuts(callbacks));

    act(() => {
      fireKeyDown("KeyR");
    });
    expect(callbacks.toggleMultipleRowsLayout).toHaveBeenCalledOnce();
  });

  it("when K is pressed, then toggles lock", () => {
    const callbacks = makeCallbacks();
    renderHook(() => useToggleShortcuts(callbacks));

    act(() => {
      fireKeyDown("KeyK");
    });
    expect(callbacks.toggleLocked).toHaveBeenCalledOnce();
  });

  it("when M is pressed, then toggles management pane", () => {
    const callbacks = makeCallbacks();
    renderHook(() => useToggleShortcuts(callbacks));

    act(() => {
      fireKeyDown("KeyM");
    });
    expect(callbacks.toggleManagementPane).toHaveBeenCalledOnce();
  });

  it("when a repeat keydown event fires, then ignores it", () => {
    const callbacks = makeCallbacks();
    renderHook(() => useToggleShortcuts(callbacks));

    act(() => {
      fireKeyDown("KeyD", { repeat: true });
    });
    expect(callbacks.toggleDarkMode).not.toHaveBeenCalled();
  });

  it("when an unrelated key is pressed, then ignores it", () => {
    const callbacks = makeCallbacks();
    renderHook(() => useToggleShortcuts(callbacks));

    act(() => {
      fireKeyDown("KeyB");
    });
    act(() => {
      fireKeyDown("KeyX");
    });
    expect(callbacks.toggleDarkMode).not.toHaveBeenCalled();
    expect(callbacks.toggleMultipleRowsLayout).not.toHaveBeenCalled();
    expect(callbacks.toggleLocked).not.toHaveBeenCalled();
    expect(callbacks.toggleManagementPane).not.toHaveBeenCalled();
  });

  it.each([
    { modifier: "metaKey" },
    { modifier: "ctrlKey" },
    { modifier: "altKey" },
    { modifier: "shiftKey" },
  ])("ignores shortcut when $modifier is held", ({ modifier }) => {
    const callbacks = makeCallbacks();
    renderHook(() => useToggleShortcuts(callbacks));

    act(() => {
      fireKeyDown("KeyR", { [modifier]: true });
    });
    expect(callbacks.toggleMultipleRowsLayout).not.toHaveBeenCalled();
  });

  it("when non-lock key is pressed on an editable element, then ignores it", () => {
    const callbacks = makeCallbacks();
    renderHook(() => useToggleShortcuts(callbacks));

    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    textarea.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyD", bubbles: true }));
    document.body.removeChild(textarea);

    expect(callbacks.toggleDarkMode).not.toHaveBeenCalled();
  });

  it("when K is pressed on a contentEditable element, then does not toggle lock", () => {
    const callbacks = makeCallbacks();
    renderHook(() => useToggleShortcuts(callbacks));

    const editableDiv = document.createElement("div");
    editableDiv.contentEditable = "true";
    document.body.appendChild(editableDiv);
    editableDiv.focus();

    editableDiv.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyK", bubbles: true }));

    expect(callbacks.toggleLocked).not.toHaveBeenCalled();
    document.body.removeChild(editableDiv);
  });

  it("when Escape is pressed on an editable element, then blurs it", () => {
    const callbacks = makeCallbacks();
    renderHook(() => useToggleShortcuts(callbacks));

    const editableDiv = document.createElement("div");
    editableDiv.contentEditable = "true";
    editableDiv.tabIndex = 0;
    document.body.appendChild(editableDiv);
    editableDiv.focus();

    expect(document.activeElement).toBe(editableDiv);

    editableDiv.dispatchEvent(new KeyboardEvent("keydown", { code: "Escape", bubbles: true }));

    expect(document.activeElement).not.toBe(editableDiv);
    document.body.removeChild(editableDiv);
  });

  it("when Escape is pressed on a non-editable element, then does not blur it", () => {
    const callbacks = makeCallbacks();
    renderHook(() => useToggleShortcuts(callbacks));

    const div = document.createElement("div");
    document.body.appendChild(div);
    div.focus();

    div.dispatchEvent(new KeyboardEvent("keydown", { code: "Escape", bubbles: true }));

    // Should not trigger any toggle
    expect(callbacks.toggleLocked).not.toHaveBeenCalled();
    document.body.removeChild(div);
  });

  it("when D is pressed from inside an input element, then does not toggle dark mode", () => {
    const callbacks = makeCallbacks();
    renderHook(() => useToggleShortcuts(callbacks));

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyD", bubbles: true }));
    document.body.removeChild(input);

    expect(callbacks.toggleDarkMode).not.toHaveBeenCalled();
  });
});
