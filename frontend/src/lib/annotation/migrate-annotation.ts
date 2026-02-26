import DOMPurify from "dompurify";

/** Converts legacy plain-text annotations to HTML paragraph tags. */
export function migrateAnnotation(annotation: string): string {
  if (!annotation) return "";
  if (annotation.trimStart().startsWith("<")) return DOMPurify.sanitize(annotation);
  return DOMPurify.sanitize(
    annotation
      .split("\n")
      .map((line) => `<p>${line || "<br>"}</p>`)
      .join(""),
  );
}
