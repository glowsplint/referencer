import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiFetch, apiPost, apiPatch, apiDelete, apiUrl, ApiError } from "./api-client";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function mockResponse(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    status: 200,
    headers: new Headers({ "content-type": "application/json" }),
    json: () => Promise.resolve({}),
    ...overrides,
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
  mockFetch.mockReset();
});

describe("when using apiUrl", () => {
  it("then prepends API base URL to path", () => {
    // VITE_API_URL defaults to "" in test env
    expect(apiUrl("/api/test")).toBe("/api/test");
  });
});

describe("when using apiFetch", () => {
  it("then sends credentials include and returns parsed JSON", async () => {
    mockFetch.mockResolvedValue(mockResponse({ json: () => Promise.resolve({ data: "test" }) }));

    const result = await apiFetch("/api/test");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/test",
      expect.objectContaining({ credentials: "include" }),
    );
    expect(result).toEqual({ data: "test" });
  });

  it("then throws ApiError with status code on non-ok response", async () => {
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

describe("when using apiPost", () => {
  it("then sends POST with JSON Content-Type header and stringified body", async () => {
    mockFetch.mockResolvedValue(mockResponse({ json: () => Promise.resolve({ id: 1 }) }));

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

  it("then sends POST without body when body is undefined", async () => {
    mockFetch.mockResolvedValue(mockResponse());

    await apiPost("/api/items");

    const callArgs = mockFetch.mock.calls[0][1];
    expect(callArgs.method).toBe("POST");
    expect(callArgs.body).toBeUndefined();
  });
});

describe("when using apiPatch", () => {
  it("then sends PATCH method", async () => {
    mockFetch.mockResolvedValue(mockResponse());

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

describe("when using apiDelete", () => {
  it("then sends DELETE method", async () => {
    mockFetch.mockResolvedValue(mockResponse());

    await apiDelete("/api/items/1");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/items/1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
