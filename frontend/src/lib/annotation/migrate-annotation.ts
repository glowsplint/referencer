import DOMPurify from "dompurify";

const PURIFY_CONFIG = { FORBID_ATTR: ["style"] };

/** Converts legacy plain-text annotations to HTML paragraph tags. */
export function migrateAnnotation(annotation: string): string {
  if (!annotation) return "";
  if (annotation.trimStart().startsWith("<")) return DOMPurify.sanitize(annotation, PURIFY_CONFIG);
  return DOMPurify.sanitize(
    annotation
      .split("\n")
      .map((line) => `<p>${line || "<br>"}</p>`)
      .join(""),
    PURIFY_CONFIG,
  );
}
