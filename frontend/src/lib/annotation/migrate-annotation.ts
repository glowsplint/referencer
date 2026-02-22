/** Converts legacy plain-text annotations to HTML paragraph tags. */
export function migrateAnnotation(annotation: string): string {
  if (!annotation) return "";
  if (annotation.trimStart().startsWith("<")) return annotation;
  return annotation
    .split("\n")
    .map((line) => `<p>${line || "<br>"}</p>`)
    .join("");
}
