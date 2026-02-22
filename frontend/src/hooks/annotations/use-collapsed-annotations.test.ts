import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCollapsedAnnotations } from "./use-collapsed-annotations";

beforeEach(() => {
  localStorage.clear();
});

describe("useCollapsedAnnotations", () => {
  it("starts with empty collapsed set", () => {
    const { result } = renderHook(() => useCollapsedAnnotations("ws-1"));
    expect(result.current.collapsedIds.size).toBe(0);
  });

  it("toggleCollapse adds an id to the set", () => {
    const { result } = renderHook(() => useCollapsedAnnotations("ws-1"));

    act(() => {
      result.current.toggleCollapse("h1");
    });

    expect(result.current.collapsedIds.has("h1")).toBe(true);
    expect(result.current.collapsedIds.size).toBe(1);
  });

  it("toggleCollapse removes an id if already present", () => {
    const { result } = renderHook(() => useCollapsedAnnotations("ws-1"));

    act(() => {
      result.current.toggleCollapse("h1");
    });
    expect(result.current.collapsedIds.has("h1")).toBe(true);

    act(() => {
      result.current.toggleCollapse("h1");
    });
    expect(result.current.collapsedIds.has("h1")).toBe(false);
    expect(result.current.collapsedIds.size).toBe(0);
  });

  it("collapseAll sets all provided IDs", () => {
    const { result } = renderHook(() => useCollapsedAnnotations("ws-1"));

    act(() => {
      result.current.collapseAll(["h1", "h2", "h3"]);
    });

    expect(result.current.collapsedIds.size).toBe(3);
    expect(result.current.collapsedIds.has("h1")).toBe(true);
    expect(result.current.collapsedIds.has("h2")).toBe(true);
    expect(result.current.collapsedIds.has("h3")).toBe(true);
  });

  it("expandAll clears all collapsed IDs", () => {
    const { result } = renderHook(() => useCollapsedAnnotations("ws-1"));

    act(() => {
      result.current.collapseAll(["h1", "h2"]);
    });
    expect(result.current.collapsedIds.size).toBe(2);

    act(() => {
      result.current.expandAll();
    });
    expect(result.current.collapsedIds.size).toBe(0);
  });

  it("persists collapsed state to localStorage", () => {
    const { result } = renderHook(() => useCollapsedAnnotations("ws-1"));

    act(() => {
      result.current.toggleCollapse("h1");
    });

    const stored = JSON.parse(localStorage.getItem("referencer-collapsed-ws-1")!);
    expect(stored).toEqual(["h1"]);
  });

  it("restores collapsed state from localStorage on init", () => {
    localStorage.setItem("referencer-collapsed-ws-1", JSON.stringify(["h1", "h2"]));

    const { result } = renderHook(() => useCollapsedAnnotations("ws-1"));

    expect(result.current.collapsedIds.size).toBe(2);
    expect(result.current.collapsedIds.has("h1")).toBe(true);
    expect(result.current.collapsedIds.has("h2")).toBe(true);
  });

  it("handles invalid localStorage gracefully", () => {
    localStorage.setItem("referencer-collapsed-ws-1", "not-json{{{");

    const { result } = renderHook(() => useCollapsedAnnotations("ws-1"));

    expect(result.current.collapsedIds.size).toBe(0);
  });

  it("uses workspaceId-specific localStorage key", () => {
    const { result: r1 } = renderHook(() => useCollapsedAnnotations("ws-1"));
    const { result: r2 } = renderHook(() => useCollapsedAnnotations("ws-2"));

    act(() => {
      r1.current.toggleCollapse("h1");
    });

    expect(r1.current.collapsedIds.has("h1")).toBe(true);
    expect(r2.current.collapsedIds.has("h1")).toBe(false);
  });
});
