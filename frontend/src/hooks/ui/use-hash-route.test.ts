import { describe, it, expect, beforeEach, afterEach } from "vitest";
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

  it("when hash is empty, then returns hub route", () => {
    window.location.hash = "";
    const { result } = renderHook(() => useHashRoute());
    expect(result.current.route).toEqual({ type: "hub" });
  });

  it("returns hub route when hash is #/", () => {
    window.location.hash = "#/";
    const { result } = renderHook(() => useHashRoute());
    expect(result.current.route).toEqual({ type: "hub" });
  });

  it("when hash is a UUID, then returns editor route with correct workspaceId", () => {
    const uuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    window.location.hash = `#/${uuid}`;
    const { result } = renderHook(() => useHashRoute());
    expect(result.current.route).toEqual({
      type: "editor",
      workspaceId: uuid,
    });
  });

  it("when hash is a KSUID, then returns editor route", () => {
    const ksuid = "0ujtsYcgvSTl8PAuAdqWYSMnLOv";
    window.location.hash = `#/${ksuid}`;
    const { result } = renderHook(() => useHashRoute());
    expect(result.current.route).toEqual({
      type: "editor",
      workspaceId: ksuid,
    });
  });

  it("when hash has query params, then strips them and returns editor route", () => {
    const uuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    window.location.hash = `#/${uuid}?access=readonly`;
    const { result } = renderHook(() => useHashRoute());
    expect(result.current.route).toEqual({
      type: "editor",
      workspaceId: uuid,
    });
  });

  it("when hash is a non-UUID/KSUID path, then returns hub route", () => {
    window.location.hash = "#/not-a-uuid";
    const { result } = renderHook(() => useHashRoute());
    expect(result.current.route).toEqual({ type: "hub" });
    // It should also redirect to #/
    expect(window.location.hash).toBe("#/");
  });

  it("when hashchange event fires, then updates route", () => {
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
    });
  });

  it("when navigate is called, then updates window.location.hash", () => {
    window.location.hash = "#/";
    const { result } = renderHook(() => useHashRoute());

    act(() => {
      result.current.navigate("#/some-path");
    });
    expect(window.location.hash).toBe("#/some-path");
  });
});
