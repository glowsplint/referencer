import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchAnnotations } from "./search-client";

vi.mock("@/lib/api-client", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "@/lib/api-client";

const mockApiFetch = vi.mocked(apiFetch);

describe("searchAnnotations", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
    mockApiFetch.mockResolvedValue({ results: [], total: 0 });
  });

  it("calls apiFetch with query param", async () => {
    await searchAnnotations("hello");
    expect(mockApiFetch).toHaveBeenCalledWith("/api/search?q=hello");
  });

  it("includes limit and offset when provided", async () => {
    await searchAnnotations("test", 10, 20);
    expect(mockApiFetch).toHaveBeenCalledWith("/api/search?q=test&limit=10&offset=20");
  });

  it("omits limit and offset when not provided", async () => {
    await searchAnnotations("query");
    expect(mockApiFetch).toHaveBeenCalledWith("/api/search?q=query");
  });

  it("returns the response from apiFetch", async () => {
    const mockResponse = {
      results: [{ annotation_id: "a1", document_id: "d1" }],
      total: 1,
    };
    mockApiFetch.mockResolvedValue(mockResponse);
    const result = await searchAnnotations("test");
    expect(result).toEqual(mockResponse);
  });
});
