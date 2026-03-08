import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock react-pdf since it requires canvas
vi.mock("react-pdf", () => ({
  Document: ({ children, loading }: any) => (
    <div data-testid="pdfDocument">
      {loading}
      {children}
    </div>
  ),
  Page: ({ pageNumber }: any) => <div data-testid={`pdfPage-${pageNumber}`} />,
  pdfjs: { GlobalWorkerOptions: { workerSrc: "" }, version: "0.0.0" },
}));

// Mock the PDF storage API
vi.mock("@/lib/pdf/pdf-storage", () => ({
  getPdfUrl: vi.fn().mockResolvedValue({ url: "https://example.com/test.pdf" }),
}));

import { PdfPane } from "./PdfPane";

describe("PdfPane", () => {
  it("shows loading state initially", () => {
    render(
      <PdfPane
        documentId="doc1"
        paneIndex={0}
        storageKey="key1"
        filename="test.pdf"
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByText("Loading PDF...")).toBeInTheDocument();
  });

  it("displays filename", async () => {
    render(
      <PdfPane
        documentId="doc1"
        paneIndex={0}
        storageKey="key1"
        filename="test.pdf"
        onRemove={vi.fn()}
      />,
    );
    // Wait for URL to load
    expect(await screen.findByText("test.pdf")).toBeInTheDocument();
  });

  it("has remove button", async () => {
    const onRemove = vi.fn();
    render(
      <PdfPane
        documentId="doc1"
        paneIndex={0}
        storageKey="key1"
        filename="test.pdf"
        onRemove={onRemove}
      />,
    );
    const removeBtn = await screen.findByTestId("removePdf");
    removeBtn.click();
    expect(onRemove).toHaveBeenCalled();
  });
});
