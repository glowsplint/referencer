import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchTourPreferences, saveTourPreference } from "./tour-client";

vi.mock("@/lib/api-client", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "@/lib/api-client";
const mockApiFetch = vi.mocked(apiFetch);

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("fetchTourPreferences", () => {
  it("converts PreferenceItem array to record", async () => {
    mockApiFetch.mockResolvedValue([
      { key: "welcome", value: "done", updatedAt: "2024-01-01" },
      { key: "editor", value: "skipped", updatedAt: "2024-01-02" },
    ]);

    const result = await fetchTourPreferences();
    expect(result).toEqual({ welcome: "done", editor: "skipped" });
    expect(mockApiFetch).toHaveBeenCalledWith("/api/preferences");
  });
});

describe("saveTourPreference", () => {
  it("sends PUT with encoded key", async () => {
    mockApiFetch.mockResolvedValue(undefined);

    await saveTourPreference("welcome tour", "done");
    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/preferences/welcome%20tour",
      expect.objectContaining({
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: "done" }),
      }),
    );
  });
});
