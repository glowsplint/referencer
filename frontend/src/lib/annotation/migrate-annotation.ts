import { sanitizeHtml } from "@/lib/sanitize";

/** Converts legacy plain-text annotations to HTML paragraph tags. */
export function migrateAnnotation(annotation: string): string {
  if (!annotation) return "";
  if (annotation.trimStart().startsWith("<")) return sanitizeHtml(annotation);
  return sanitizeHtml(
    annotation
      .split("\n")
      .map((line) => `<p>${line || "<br>"}</p>`)
      .join(""),
  );
}
