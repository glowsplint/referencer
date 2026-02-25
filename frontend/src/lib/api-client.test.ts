import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiError, apiUrl, apiFetch, apiPost, apiPatch, apiDelete } from "./api-client";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  };
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("ApiError", () => {
  describe("when constructed", () => {
    it("has name, status, and message", () => {
      const error = new ApiError(404, "Not found");
      expect(error.name).toBe("ApiError");
      expect(error.status).toBe(404);
      expect(error.message).toBe("Not found");
      expect(error).toBeInstanceOf(Error);
    });
  });
});

describe("apiUrl", () => {
  describe("when called with a path", () => {
    it("returns the path prefixed with API_URL (empty in test)", () => {
      const result = apiUrl("/api/workspaces");
      expect(result).toBe("/api/workspaces");
    });
  });
});

describe("apiFetch", () => {
  describe("when response is ok", () => {
    it("returns parsed JSON", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ id: 1 }));
      const result = await apiFetch("/api/test");
      expect(result).toEqual({ id: 1 });
    });

    it("includes credentials", async () => {
      mockFetch.mockResolvedValue(jsonResponse({}));
      await apiFetch("/api/test");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ credentials: "include" }),
      );
    });
  });

  describe("when response is not ok", () => {
    it("throws ApiError with status", async () => {
      mockFetch.mockResolvedValue(jsonResponse(null, 500));
      await expect(apiFetch("/api/fail")).rejects.toThrow(ApiError);
      await expect(apiFetch("/api/fail")).rejects.toMatchObject({
        status: 500,
      });
    });
  });
});

describe("apiPost", () => {
  describe("when called with a body", () => {
    it("sends POST with JSON content-type and stringified body", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ ok: true }));
      await apiPost("/api/items", { name: "test" });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ name: "test" }),
        }),
      );
    });
  });

  describe("when called without a body", () => {
    it("sends POST without body or content-type", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ ok: true }));
      await apiPost("/api/trigger");
      const [, options] = mockFetch.mock.calls[0];
      expect(options.method).toBe("POST");
      expect(options.body).toBeUndefined();
    });
  });
});

describe("apiPatch", () => {
  describe("when called with a body", () => {
    it("sends PATCH with JSON body", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ ok: true }));
      await apiPatch("/api/items/1", { name: "updated" });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ name: "updated" }),
        }),
      );
    });
  });
});

describe("apiDelete", () => {
  describe("when called", () => {
    it("sends DELETE request", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ ok: true }));
      await apiDelete("/api/items/1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: "DELETE" }),
      );
    });
  });
});
