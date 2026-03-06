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

  it("when hash is empty, then redirects to #/hub and returns hub route", () => {
    window.location.hash = "";
    const { result } = renderHook(() => useHashRoute());
    expect(result.current.route).toEqual({ type: "hub" });
    expect(window.location.hash).toBe("#/hub");
  });

  it("returns hub route when hash is #/hub", () => {
    window.location.hash = "#/hub";
    const { result } = renderHook(() => useHashRoute());
    expect(result.current.route).toEqual({ type: "hub" });
  });

  it("when hash is #/, then redirects to #/hub", () => {
    window.location.hash = "#/";
    const { result } = renderHook(() => useHashRoute());
    expect(result.current.route).toEqual({ type: "hub" });
    expect(window.location.hash).toBe("#/hub");
  });

  it("when hash is a UUID, then returns editor route with correct documentId", () => {
    const uuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    window.location.hash = `#/${uuid}`;
    const { result } = renderHook(() => useHashRoute());
    expect(result.current.route).toEqual({
      type: "editor",
      documentId: uuid,
    });
  });

  it("when hash is a KSUID, then returns editor route", () => {
    const ksuid = "0ujtsYcgvSTl8PAuAdqWYSMnLOv";
    window.location.hash = `#/${ksuid}`;
    const { result } = renderHook(() => useHashRoute());
    expect(result.current.route).toEqual({
      type: "editor",
      documentId: ksuid,
    });
  });

  it("when hash has query params, then strips them and returns editor route", () => {
    const uuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    window.location.hash = `#/${uuid}?access=readonly`;
    const { result } = renderHook(() => useHashRoute());
    expect(result.current.route).toEqual({
      type: "editor",
      documentId: uuid,
    });
  });

  it("when hash is a non-UUID/KSUID path, then redirects to #/hub", () => {
    window.location.hash = "#/not-a-uuid";
    const { result } = renderHook(() => useHashRoute());
    expect(result.current.route).toEqual({ type: "hub" });
    expect(window.location.hash).toBe("#/hub");
  });

  it("when hashchange event fires, then updates route", () => {
    window.location.hash = "#/hub";
    const { result } = renderHook(() => useHashRoute());
    expect(result.current.route).toEqual({ type: "hub" });

    const uuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    act(() => {
      window.location.hash = `#/${uuid}`;
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(result.current.route).toEqual({
      type: "editor",
      documentId: uuid,
    });
  });

  it("when navigate is called, then updates window.location.hash", () => {
    window.location.hash = "#/hub";
    const { result } = renderHook(() => useHashRoute());

    act(() => {
      result.current.navigate("#/some-path");
    });
    expect(window.location.hash).toBe("#/some-path");
  });
});
