// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { downloadFile } from "../download";

describe("downloadFile", () => {
  it("creates a blob with the correct mime type and triggers download", () => {
    const createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test-url");
    const revokeObjectURLSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const clickSpy = vi.fn();
    const fakeAnchor = { href: "", download: "", click: clickSpy } as unknown as HTMLAnchorElement;
    vi.spyOn(document, "createElement").mockReturnValue(fakeAnchor);
    vi.spyOn(document.body, "appendChild").mockImplementation((node) => node);
    vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);

    downloadFile("hello world", "test.md", "text/markdown");

    // Blob created with correct type
    const blob = createObjectURLSpy.mock.calls[0][0] as Blob;
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("text/markdown");

    // Anchor configured and clicked
    expect(fakeAnchor.href).toBe("blob:test-url");
    expect(fakeAnchor.download).toBe("test.md");
    expect(clickSpy).toHaveBeenCalledOnce();

    // Cleaned up
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:test-url");
  });
});
