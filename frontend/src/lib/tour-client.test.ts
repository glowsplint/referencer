import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchTourPreferences, saveTourPreference } from "./tour-client";
import { apiFetch } from "@/lib/api-client";

vi.mock("@/lib/api-client", () => ({
  apiFetch: vi.fn(),
}));

const mockedApiFetch = vi.mocked(apiFetch);

beforeEach(() => {
  mockedApiFetch.mockReset();
});

describe("fetchTourPreferences", () => {
  describe("when API returns preference items", () => {
    it("converts them to a key-value record", async () => {
      mockedApiFetch.mockResolvedValue([
        { key: "tourCompleted", value: "true", updatedAt: "2025-01-01" },
        { key: "theme", value: "dark", updatedAt: "2025-01-02" },
      ]);
      const result = await fetchTourPreferences();
      expect(result).toEqual({
        tourCompleted: "true",
        theme: "dark",
      });
    });
  });

  describe("when API returns empty array", () => {
    it("returns empty object", async () => {
      mockedApiFetch.mockResolvedValue([]);
      const result = await fetchTourPreferences();
      expect(result).toEqual({});
    });
  });
});

describe("saveTourPreference", () => {
  describe("when called with key and value", () => {
    it("sends PUT request with encoded key and JSON body", async () => {
      mockedApiFetch.mockResolvedValue(undefined);
      await saveTourPreference("tour:main", "done");
      expect(mockedApiFetch).toHaveBeenCalledWith(
        "/api/preferences/tour%3Amain",
        expect.objectContaining({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: "done" }),
        }),
      );
    });
  });
});
