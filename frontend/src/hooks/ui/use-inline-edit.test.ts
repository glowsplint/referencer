import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useInlineEdit } from "./use-inline-edit";

function setup(currentName = "Layer 1") {
  const onCommit = vi.fn();
  const hook = renderHook(() => useInlineEdit({ currentName, onCommit }));
  return { ...hook, onCommit };
}

describe("useInlineEdit", () => {
  it("when initialized, then starts not editing", () => {
    const { result } = setup();
    expect(result.current.isEditing).toBe(false);
  });

  it("when startEditing is called, then enters edit mode with current name", () => {
    const { result } = setup("Layer 1");
    act(() => {
      result.current.startEditing();
    });
    expect(result.current.isEditing).toBe(true);
    expect(result.current.editingValue).toBe("Layer 1");
  });

  it("when startEditing is called with nameOverride, then uses the override", () => {
    const { result } = setup("Layer 1");
    act(() => {
      result.current.startEditing("Custom");
    });
    expect(result.current.editingValue).toBe("Custom");
  });

  it("when commitEdit is called, then calls onCommit with trimmed value and exits editing", () => {
    const { result, onCommit } = setup("Layer 1");
    act(() => {
      result.current.startEditing();
    });
    act(() => {
      result.current.setEditingValue("  New Name  ");
    });
    act(() => {
      result.current.commitEdit();
    });
    expect(onCommit).toHaveBeenCalledWith("New Name");
    expect(result.current.isEditing).toBe(false);
  });

  it("when commitEdit is called with empty value, then falls back to currentName", () => {
    const { result, onCommit } = setup("Layer 1");
    act(() => {
      result.current.startEditing();
    });
    act(() => {
      result.current.setEditingValue("   ");
    });
    act(() => {
      result.current.commitEdit();
    });
    expect(onCommit).toHaveBeenCalledWith("Layer 1");
  });

  it("when cancelEdit is called, then exits editing without calling onCommit", () => {
    const { result, onCommit } = setup();
    act(() => {
      result.current.startEditing();
    });
    act(() => {
      result.current.setEditingValue("Changed");
    });
    act(() => {
      result.current.cancelEdit();
    });
    expect(result.current.isEditing).toBe(false);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("when Enter is pressed via inputProps, then commits", () => {
    const { result, onCommit } = setup("Layer 1");
    act(() => {
      result.current.startEditing();
    });
    act(() => {
      result.current.setEditingValue("Renamed");
    });
    act(() => {
      result.current.inputProps.onKeyDown({
        key: "Enter",
      } as React.KeyboardEvent<HTMLInputElement>);
    });
    expect(onCommit).toHaveBeenCalledWith("Renamed");
  });

  it("when Escape is pressed via inputProps, then cancels", () => {
    const { result, onCommit } = setup();
    act(() => {
      result.current.startEditing();
    });
    act(() => {
      result.current.inputProps.onKeyDown({
        key: "Escape",
      } as React.KeyboardEvent<HTMLInputElement>);
    });
    expect(result.current.isEditing).toBe(false);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("when blur occurs via inputProps, then commits", () => {
    const { result, onCommit } = setup("Layer 1");
    act(() => {
      result.current.startEditing();
    });
    act(() => {
      result.current.setEditingValue("Blurred");
    });
    act(() => {
      result.current.inputProps.onBlur();
    });
    expect(onCommit).toHaveBeenCalledWith("Blurred");
  });

  it("when change occurs via inputProps, then updates editingValue", () => {
    const { result } = setup();
    act(() => {
      result.current.startEditing();
    });
    act(() => {
      result.current.inputProps.onChange({
        target: { value: "Hello" },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    expect(result.current.editingValue).toBe("Hello");
  });
});
