import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as Y from "yjs";
import { usePaneTypes } from "./use-pane-types";

describe("usePaneTypes", () => {
  it("returns empty paneTypes initially", () => {
    const doc = new Y.Doc();
    const { result } = renderHook(() => usePaneTypes(doc));
    expect(result.current.paneTypes).toEqual({});
  });

  it("returns null-safe when doc is null", () => {
    const { result } = renderHook(() => usePaneTypes(null));
    expect(result.current.paneTypes).toEqual({});
  });

  it("setPaneType updates paneTypes", () => {
    const doc = new Y.Doc();
    const { result } = renderHook(() => usePaneTypes(doc));
    act(() => {
      result.current.setPaneType(0, "pdf", { storageKey: "key1", filename: "test.pdf" });
    });
    expect(result.current.paneTypes[0]).toEqual({
      type: "pdf",
      storageKey: "key1",
      filename: "test.pdf",
    });
  });

  it("clearPaneType removes pane metadata", () => {
    const doc = new Y.Doc();
    const { result } = renderHook(() => usePaneTypes(doc));
    act(() => {
      result.current.setPaneType(0, "pdf", { storageKey: "key1" });
    });
    expect(result.current.paneTypes[0]).toBeDefined();
    act(() => {
      result.current.clearPaneType(0);
    });
    expect(result.current.paneTypes[0]).toBeUndefined();
  });
});
