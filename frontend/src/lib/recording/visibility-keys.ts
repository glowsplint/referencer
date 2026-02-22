/**
 * Parse a visibility snapshot annotation key like "highlight:layerId:annotationId"
 * into its component parts and the corresponding Yjs array type name.
 */
export function parseVisibilityKey(key: string): {
  type: string;
  layerId: string;
  annotationId: string;
  yType: "highlights" | "arrows" | "underlines";
} {
  const parts = key.split(":");
  const type = parts[0]; // "highlight", "arrow", "underline"
  const layerId = parts[1];
  const annotationId = parts.slice(2).join(":");
  const yType =
    type === "highlight" ? "highlights" : type === "arrow" ? "arrows" : "underlines";
  return { type, layerId, annotationId, yType };
}
