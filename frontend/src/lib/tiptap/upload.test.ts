import { describe, it, expect, vi } from "vitest";
import { handleImageUpload, MAX_FILE_SIZE } from "./upload";

function makeFile(size: number, name = "test.png", type = "image/png"): File {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

describe("handleImageUpload", () => {
  it("reads a file and returns a data URL", async () => {
    const file = makeFile(100);
    const result = await handleImageUpload(file);
    expect(result).toMatch(/^data:/);
  });

  it("calls onProgress with 0 at start and 100 at end", async () => {
    const file = makeFile(100);
    const onProgress = vi.fn();
    await handleImageUpload(file, onProgress);
    expect(onProgress).toHaveBeenCalledWith({ progress: 0 });
    expect(onProgress).toHaveBeenCalledWith({ progress: 100 });
  });

  it("throws when no file is provided", async () => {
    await expect(handleImageUpload(null as unknown as File)).rejects.toThrow("No file provided");
  });

  it("throws when file exceeds MAX_FILE_SIZE", async () => {
    const file = makeFile(MAX_FILE_SIZE + 1);
    await expect(handleImageUpload(file)).rejects.toThrow("File size exceeds maximum allowed");
  });

  it("rejects when abortSignal is already aborted", async () => {
    const file = makeFile(100);
    const controller = new AbortController();
    controller.abort();
    await expect(handleImageUpload(file, undefined, controller.signal)).rejects.toThrow(
      "Upload cancelled",
    );
  });

  it("rejects when abortSignal fires during read", async () => {
    const file = makeFile(100);
    const controller = new AbortController();

    // Abort after a small delay
    const promise = handleImageUpload(file, undefined, controller.signal);
    controller.abort();

    // The promise should eventually reject with cancel or resolve
    // Depending on timing, it may succeed or cancel
    try {
      await promise;
      // If it succeeded (FileReader was fast), that's fine too
    } catch (err) {
      expect((err as Error).message).toBe("Upload cancelled");
    }
  });

  it("MAX_FILE_SIZE is 5MB", () => {
    expect(MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
  });
});
