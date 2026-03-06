import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/data/use-auth";
import { createDocument, touchDocument } from "@/lib/document-client";

export function useDocumentAutosave(documentId: string) {
  const { isAuthenticated } = useAuth();
  const registeredRef = useRef(false);

  useEffect(() => {
    registeredRef.current = false;
  }, [documentId]);

  useEffect(() => {
    if (!isAuthenticated || registeredRef.current) return;
    registeredRef.current = true;
    createDocument(documentId).catch(() => {});
  }, [isAuthenticated, documentId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      touchDocument(documentId).catch(() => {});
    }, 60_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, documentId]);
}
