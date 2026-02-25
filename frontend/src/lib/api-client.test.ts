import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiFetch, apiPost, apiPatch, apiDelete, apiUrl, ApiError } from "./api-client";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.restoreAllMocks();
  mockFetch.mockReset();
});

describe("apiUrl", () => {
  it("prepends API base URL to path", () => {
    // VITE_API_URL defaults to "" in test env
    expect(apiUrl("/api/test")).toBe("/api/test");
  });
});

describe("apiFetch", () => {
  it("sends credentials include and returns parsed JSON", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: "test" }),
    });

    const result = await apiFetch("/api/test");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/test",
      expect.objectContaining({ credentials: "include" }),
    );
    expect(result).toEqual({ data: "test" });
  });

  it("throws ApiError with status code on non-ok response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
    });

    await expect(apiFetch("/api/missing")).rejects.toThrow(ApiError);
    try {
      await apiFetch("/api/missing");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(404);
    }
  });
});

describe("apiPost", () => {
  it("sends POST with JSON Content-Type header and stringified body", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1 }),
    });

    await apiPost("/api/items", { name: "test" });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/items",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify({ name: "test" }),
      }),
    );
  });

  it("sends POST without body when body is undefined", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await apiPost("/api/items");

    const callArgs = mockFetch.mock.calls[0][1];
    expect(callArgs.method).toBe("POST");
    expect(callArgs.body).toBeUndefined();
  });
});

describe("apiPatch", () => {
  it("sends PATCH method", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await apiPatch("/api/items/1", { name: "updated" });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/items/1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ name: "updated" }),
      }),
    );
  });
});

describe("apiDelete", () => {
  it("sends DELETE method", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await apiDelete("/api/items/1");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/items/1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
