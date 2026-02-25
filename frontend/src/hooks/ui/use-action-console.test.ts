import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useActionConsole } from "./use-action-console";

function fireKey(key: string, options: Partial<KeyboardEvent> = {}) {
  document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...options }));
}

describe("useActionConsole", () => {
  it("when backtick key is pressed, then toggles isOpen", () => {
    const { result } = renderHook(() => useActionConsole());
    expect(result.current.isOpen).toBe(false);

    act(() => fireKey("`"));
    expect(result.current.isOpen).toBe(true);

    act(() => fireKey("`"));
    expect(result.current.isOpen).toBe(false);
  });

  it.each([
    { modifier: "metaKey" },
    { modifier: "ctrlKey" },
    { modifier: "altKey" },
    { modifier: "shiftKey" },
  ])("ignores backtick when $modifier is held", ({ modifier }) => {
    const { result } = renderHook(() => useActionConsole());

    act(() => fireKey("`", { [modifier]: true }));
    expect(result.current.isOpen).toBe(false);
  });

  it("when focus is in an editable element, then ignores backtick", () => {
    const { result } = renderHook(() => useActionConsole());

    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "`", bubbles: true }));
    document.body.removeChild(textarea);

    expect(result.current.isOpen).toBe(false);
  });

  it("when focus is in a contentEditable element, then ignores backtick", () => {
    const { result } = renderHook(() => useActionConsole());

    const div = document.createElement("div");
    div.contentEditable = "true";
    document.body.appendChild(div);
    div.dispatchEvent(new KeyboardEvent("keydown", { key: "`", bubbles: true }));
    document.body.removeChild(div);

    expect(result.current.isOpen).toBe(false);
  });

  it("when focus is in an input element, then ignores backtick", () => {
    const { result } = renderHook(() => useActionConsole());

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "`", bubbles: true }));
    document.body.removeChild(input);

    expect(result.current.isOpen).toBe(false);
  });
});
