import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BugReportDialog } from "./BugReportDialog";
import { renderWithWorkspace } from "@/test/render-with-workspace";

vi.stubGlobal("__APP_VERSION__", "abc1234");

function renderDialog(overrides: { open?: boolean; onOpenChange?: ReturnType<typeof vi.fn> } = {}) {
  const onOpenChange = overrides.onOpenChange ?? vi.fn();
  return renderWithWorkspace(
    <BugReportDialog open={overrides.open ?? true} onOpenChange={onOpenChange} />,
  );
}

function findFeedbackCall(mockFetch: ReturnType<typeof vi.fn>) {
  const call = mockFetch.mock.calls.find((c: [string, RequestInit]) => c[0] === "/api/feedback");
  return call;
}

describe("BugReportDialog", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("when opened", () => {
    it("then shows the bug report form", () => {
      renderDialog();
      expect(screen.getByText("Report a Bug")).toBeInTheDocument();
      expect(screen.getByTestId("bugReportTitle")).toBeInTheDocument();
      expect(screen.getByTestId("bugReportDescription")).toBeInTheDocument();
      expect(screen.getByTestId("bugReportSubmit")).toBeInTheDocument();
    });

    it("then shows the drop zone", () => {
      renderDialog();
      expect(screen.getByTestId("bugReportDropZone")).toBeInTheDocument();
    });
  });

  describe("when closed", () => {
    it("then renders nothing", () => {
      renderDialog({ open: false });
      expect(screen.queryByText("Report a Bug")).not.toBeInTheDocument();
    });
  });

  describe("when title is empty", () => {
    it("then disables the submit button", () => {
      renderDialog();
      expect(screen.getByTestId("bugReportSubmit")).toBeDisabled();
    });
  });

  describe("when title is only whitespace", () => {
    it("then disables the submit button", () => {
      renderDialog();
      fireEvent.change(screen.getByTestId("bugReportTitle"), { target: { value: "   " } });
      expect(screen.getByTestId("bugReportSubmit")).toBeDisabled();
    });
  });

  describe("when title has content", () => {
    it("then enables the submit button", () => {
      renderDialog();
      fireEvent.change(screen.getByTestId("bugReportTitle"), { target: { value: "A bug" } });
      expect(screen.getByTestId("bugReportSubmit")).not.toBeDisabled();
    });
  });

  describe("when form is submitted", () => {
    it("then sends FormData payload to the API", async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      globalThis.fetch = mockFetch;

      renderDialog();
      fireEvent.change(screen.getByTestId("bugReportTitle"), { target: { value: "Test bug" } });
      fireEvent.change(screen.getByTestId("bugReportDescription"), {
        target: { value: "Steps to reproduce" },
      });
      fireEvent.click(screen.getByTestId("bugReportSubmit"));

      await waitFor(() => {
        expect(findFeedbackCall(mockFetch)).toBeDefined();
      });

      const call = findFeedbackCall(mockFetch)!;
      expect(call[1].method).toBe("POST");
      expect(call[1].credentials).toBe("include");
      const body = call[1].body as FormData;
      expect(body).toBeInstanceOf(FormData);
      expect(body.get("title")).toBe("Test bug");
      expect(body.get("description")).toBe("Steps to reproduce");
    });

    it("then trims whitespace from title and description before sending", async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      globalThis.fetch = mockFetch;

      renderDialog();
      fireEvent.change(screen.getByTestId("bugReportTitle"), { target: { value: "  A bug  " } });
      fireEvent.change(screen.getByTestId("bugReportDescription"), {
        target: { value: "  Some details  " },
      });
      fireEvent.click(screen.getByTestId("bugReportSubmit"));

      await waitFor(() => {
        expect(findFeedbackCall(mockFetch)).toBeDefined();
      });

      const body = findFeedbackCall(mockFetch)![1].body as FormData;
      expect(body.get("title")).toBe("A bug");
      expect(body.get("description")).toBe("Some details");
    });

    it("then includes viewport and appVersion in FormData", async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      globalThis.fetch = mockFetch;

      renderDialog();
      fireEvent.change(screen.getByTestId("bugReportTitle"), { target: { value: "A bug" } });
      fireEvent.click(screen.getByTestId("bugReportSubmit"));

      await waitFor(() => {
        expect(findFeedbackCall(mockFetch)).toBeDefined();
      });

      const body = findFeedbackCall(mockFetch)![1].body as FormData;
      expect(body.get("viewport")).toMatch(/^\d+x\d+$/);
      expect(body.get("appVersion")).toBe("abc1234");
    });

    it("then does not set Content-Type header (browser sets multipart boundary)", async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      globalThis.fetch = mockFetch;

      renderDialog();
      fireEvent.change(screen.getByTestId("bugReportTitle"), { target: { value: "A bug" } });
      fireEvent.click(screen.getByTestId("bugReportSubmit"));

      await waitFor(() => {
        expect(findFeedbackCall(mockFetch)).toBeDefined();
      });

      const callOptions = findFeedbackCall(mockFetch)![1];
      expect(callOptions.headers).toBeUndefined();
    });
  });

  describe("when submission succeeds", () => {
    it("then closes the dialog", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      const onOpenChange = vi.fn();

      renderDialog({ onOpenChange });
      fireEvent.change(screen.getByTestId("bugReportTitle"), { target: { value: "A bug" } });
      fireEvent.click(screen.getByTestId("bugReportSubmit"));

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe("when submission fails", () => {
    it("then does not close the dialog", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
      const onOpenChange = vi.fn();

      renderDialog({ onOpenChange });
      fireEvent.change(screen.getByTestId("bugReportTitle"), { target: { value: "A bug" } });
      fireEvent.click(screen.getByTestId("bugReportSubmit"));

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByTestId("bugReportSubmit")).not.toBeDisabled();
      });

      const closeCalls = onOpenChange.mock.calls.filter((call: [boolean]) => call[0] === false);
      expect(closeCalls).toHaveLength(0);
    });
  });

  describe("when rate limited (429)", () => {
    it("then handles the rate limit response", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 429 });
      const onOpenChange = vi.fn();

      renderDialog({ onOpenChange });
      fireEvent.change(screen.getByTestId("bugReportTitle"), { target: { value: "A bug" } });
      fireEvent.click(screen.getByTestId("bugReportSubmit"));

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalled();
      });
    });
  });

  describe("when a network error occurs", () => {
    it("then handles the error gracefully", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      renderDialog();
      fireEvent.change(screen.getByTestId("bugReportTitle"), { target: { value: "A bug" } });
      fireEvent.click(screen.getByTestId("bugReportSubmit"));

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalled();
      });
    });
  });

  describe("when an image is selected", () => {
    it("then shows the image preview", async () => {
      renderDialog();
      const file = new File(["fake-image-data"], "screenshot.png", { type: "image/png" });
      const dropZone = screen.getByTestId("bugReportDropZone");
      const input = dropZone.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByTestId("bugReportImagePreview")).toBeInTheDocument();
      });
    });

    it("then shows the remove button", async () => {
      renderDialog();
      const file = new File(["fake-image-data"], "screenshot.png", { type: "image/png" });
      const dropZone = screen.getByTestId("bugReportDropZone");
      const input = dropZone.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByTestId("bugReportImageRemove")).toBeInTheDocument();
      });
    });

    it("then includes the image in FormData on submit", async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      globalThis.fetch = mockFetch;

      renderDialog();
      const file = new File(["fake-image-data"], "screenshot.png", { type: "image/png" });
      const dropZone = screen.getByTestId("bugReportDropZone");
      const input = dropZone.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByTestId("bugReportImagePreview")).toBeInTheDocument();
      });

      fireEvent.change(screen.getByTestId("bugReportTitle"), {
        target: { value: "Bug with image" },
      });
      fireEvent.click(screen.getByTestId("bugReportSubmit"));

      await waitFor(() => {
        expect(findFeedbackCall(mockFetch)).toBeDefined();
      });

      const body = findFeedbackCall(mockFetch)![1].body as FormData;
      expect(body.get("image")).toBeInstanceOf(File);
    });
  });

  describe("when the image remove button is clicked", () => {
    it("then removes the image preview", async () => {
      renderDialog();
      const file = new File(["fake-image-data"], "screenshot.png", { type: "image/png" });
      const dropZone = screen.getByTestId("bugReportDropZone");
      const input = dropZone.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByTestId("bugReportImagePreview")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("bugReportImageRemove"));

      await waitFor(() => {
        expect(screen.queryByTestId("bugReportImagePreview")).not.toBeInTheDocument();
      });
    });
  });

  describe("when an invalid image type is selected", () => {
    it("then does not show the preview and shows a toast error", async () => {
      const toastModule = await import("sonner");
      const toastErrorSpy = vi.spyOn(toastModule.toast, "error");

      renderDialog();
      const file = new File(["not-an-image"], "document.pdf", { type: "application/pdf" });
      const dropZone = screen.getByTestId("bugReportDropZone");
      const input = dropZone.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      expect(screen.queryByTestId("bugReportImagePreview")).not.toBeInTheDocument();
      expect(toastErrorSpy).toHaveBeenCalledWith(
        "Only PNG, JPEG, WebP, and GIF images are allowed.",
      );
    });
  });

  describe("when an oversized image is selected", () => {
    it("then does not show the preview and shows a toast error", async () => {
      const toastModule = await import("sonner");
      const toastErrorSpy = vi.spyOn(toastModule.toast, "error");

      renderDialog();
      const largeContent = new ArrayBuffer(6 * 1024 * 1024);
      const file = new File([largeContent], "huge.png", { type: "image/png" });
      const dropZone = screen.getByTestId("bugReportDropZone");
      const input = dropZone.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      expect(screen.queryByTestId("bugReportImagePreview")).not.toBeInTheDocument();
      expect(toastErrorSpy).toHaveBeenCalledWith("Image must be under 5 MB.");
    });
  });

  describe("when no image is selected", () => {
    it("then does not include image in FormData on submit", async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      globalThis.fetch = mockFetch;

      renderDialog();
      fireEvent.change(screen.getByTestId("bugReportTitle"), { target: { value: "Bug no image" } });
      fireEvent.click(screen.getByTestId("bugReportSubmit"));

      await waitFor(() => {
        expect(findFeedbackCall(mockFetch)).toBeDefined();
      });

      const body = findFeedbackCall(mockFetch)![1].body as FormData;
      expect(body.get("image")).toBeNull();
    });
  });

  describe("when an image is pasted via clipboard", () => {
    it("then shows the image preview", async () => {
      renderDialog();

      const file = new File(["fake-image-data"], "pasted.png", { type: "image/png" });
      const clipboardData = {
        items: [
          {
            kind: "file",
            type: "image/png",
            getAsFile: () => file,
          },
        ],
      };

      const dialog = screen.getByTestId("bugReportDialog");
      fireEvent.paste(dialog, { clipboardData });

      await waitFor(() => {
        expect(screen.getByTestId("bugReportImagePreview")).toBeInTheDocument();
      });
    });
  });

  describe("when an image is dropped on the drop zone", () => {
    it("then shows the image preview", async () => {
      renderDialog();

      const file = new File(["fake-image-data"], "dropped.png", { type: "image/png" });
      const dropZone = screen.getByTestId("bugReportDropZone");

      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      });

      await waitFor(() => {
        expect(screen.getByTestId("bugReportImagePreview")).toBeInTheDocument();
      });
    });
  });
});
