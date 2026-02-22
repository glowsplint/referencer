import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHashRoute } from "./use-hash-route";

describe("useHashRoute", () => {
  let originalHash: string;

  beforeEach(() => {
    originalHash = window.location.hash;
  });

  afterEach(() => {
    window.location.hash = originalHash;
  });

  it("returns hub route when hash is empty", () => {
    window.location.hash = "";
    const { result } = renderHook(() => useHashRoute());
    expect(result.current.route).toEqual({ type: "hub" });
  });

  it("returns hub route when hash is #/", () => {
    window.location.hash = "#/";
    const { result } = renderHook(() => useHashRoute());
    expect(result.current.route).toEqual({ type: "hub" });
  });

  it("returns editor route with correct workspaceId for UUID hash", () => {
    const uuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    window.location.hash = `#/${uuid}`;
    const { result } = renderHook(() => useHashRoute());
    expect(result.current.route).toEqual({
      type: "editor",
      workspaceId: uuid,
      readOnly: false,
    });
  });

  it("returns editor route with readOnly=true when access=readonly", () => {
    const uuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    window.location.hash = `#/${uuid}?access=readonly`;
    const { result } = renderHook(() => useHashRoute());
    expect(result.current.route).toEqual({
      type: "editor",
      workspaceId: uuid,
      readOnly: true,
    });
  });

  it("returns hub route for non-UUID hash paths", () => {
    window.location.hash = "#/not-a-uuid";
    const { result } = renderHook(() => useHashRoute());
    expect(result.current.route).toEqual({ type: "hub" });
    // It should also redirect to #/
    expect(window.location.hash).toBe("#/");
  });

  it("updates route on hashchange event", () => {
    window.location.hash = "#/";
    const { result } = renderHook(() => useHashRoute());
    expect(result.current.route).toEqual({ type: "hub" });

    const uuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    act(() => {
      window.location.hash = `#/${uuid}`;
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(result.current.route).toEqual({
      type: "editor",
      workspaceId: uuid,
      readOnly: false,
    });
  });

  it("navigate function updates window.location.hash", () => {
    window.location.hash = "#/";
    const { result } = renderHook(() => useHashRoute());

    act(() => {
      result.current.navigate("#/some-path");
    });
    expect(window.location.hash).toBe("#/some-path");
  });
});
