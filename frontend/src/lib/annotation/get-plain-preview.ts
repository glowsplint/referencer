/** Strip HTML tags and truncate to a maximum length with ellipsis. */
export function getPlainPreview(html: string, maxLen = 60): string {
  const text = html.replace(/<[^>]*>/g, "").trim();
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + "\u2026";
}
