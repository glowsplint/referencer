import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { getPdfUrl } from "@/lib/pdf/pdf-storage";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface PdfPaneProps {
  documentId: string;
  paneIndex: number;
  storageKey: string;
  filename: string;
  onRemove: () => void;
}

export function PdfPane({ documentId, storageKey, filename, onRemove }: PdfPaneProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getPdfUrl(documentId, storageKey)
      .then((data) => {
        if (!cancelled) {
          setUrl(data.url);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(String(err));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [documentId, storageKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Loading PDF...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
        <span>Failed to load PDF</span>
        <button onClick={onRemove} className="text-xs underline">
          Remove PDF
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-muted/20">
      <div className="flex items-center justify-between px-3 py-1 border-b border-border bg-muted/30 text-sm">
        <span className="truncate text-muted-foreground">{filename}</span>
        <button
          onClick={onRemove}
          className="text-xs text-muted-foreground hover:text-foreground shrink-0 ml-2"
          data-testid="removePdf"
        >
          Remove
        </button>
      </div>
      <Document
        file={url}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        onLoadError={(err) => setError(String(err))}
        loading={<div className="p-4 text-center text-muted-foreground">Loading...</div>}
      >
        {Array.from(new Array(numPages), (_, i) => (
          <Page key={`page_${i + 1}`} pageNumber={i + 1} width={800} />
        ))}
      </Document>
    </div>
  );
}

export default PdfPane;
