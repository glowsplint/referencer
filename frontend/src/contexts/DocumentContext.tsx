// React context that provides the document state (layers, editors, settings,
// actions) to all descendant components. Typed from the useEditorDocument hook
// return value so consumers get full type safety without prop-drilling.
import { createContext, useContext } from "react";
import type { useEditorDocument } from "@/hooks/data/use-editor-document";

export type DocumentContextValue = ReturnType<typeof useEditorDocument>;

const DocumentContext = createContext<DocumentContextValue | null>(null);

export function DocumentProvider({
  value,
  children,
}: {
  value: DocumentContextValue;
  children: React.ReactNode;
}) {
  return <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDocument(): DocumentContextValue {
  const ctx = useContext(DocumentContext);
  if (!ctx) {
    throw new Error("useDocument must be used within a DocumentProvider");
  }
  return ctx;
}
