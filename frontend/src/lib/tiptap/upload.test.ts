import { describe, it, expect, vi } from "vitest";
import { handleImageUpload, MAX_FILE_SIZE } from "./upload";

function createMockFile(size: number, type = "image/png"): File {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], "test.png", { type });
}

describe("MAX_FILE_SIZE", () => {
  it("is 5MB", () => {
    expect(MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
  });
});

describe("handleImageUpload", () => {
  describe("when no file is provided", () => {
    it("throws 'No file provided'", async () => {
      await expect(handleImageUpload(null as unknown as File)).rejects.toThrow("No file provided");
    });
  });

  describe("when file exceeds max size", () => {
    it("throws file size error", async () => {
      const bigFile = createMockFile(MAX_FILE_SIZE + 1);
      await expect(handleImageUpload(bigFile)).rejects.toThrow("File size exceeds maximum allowed");
    });
  });

  describe("when file is within size limit", () => {
    it("returns a data URL string", async () => {
      const file = createMockFile(100);
      const result = await handleImageUpload(file);
      expect(result).toMatch(/^data:/);
    });
  });

  describe("when onProgress is provided", () => {
    it("calls onProgress with 0 then 100", async () => {
      const file = createMockFile(100);
      const onProgress = vi.fn();
      await handleImageUpload(file, onProgress);
      expect(onProgress).toHaveBeenCalledWith({ progress: 0 });
      expect(onProgress).toHaveBeenCalledWith({ progress: 100 });
    });
  });

  describe("when abortSignal is already aborted", () => {
    it("rejects with 'Upload cancelled'", async () => {
      const file = createMockFile(100);
      const controller = new AbortController();
      controller.abort();
      await expect(handleImageUpload(file, undefined, controller.signal)).rejects.toThrow(
        "Upload cancelled",
      );
    });
  });
});
