/** Returns true if the given HTML string contains no visible text content. */
export function isAnnotationEmpty(html: string): boolean {
  return !html?.replace(/<[^>]*>/g, "").trim();
}
