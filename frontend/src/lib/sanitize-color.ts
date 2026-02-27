const HEX_COLOR_RE = /^#([0-9a-fA-F]{3,8})$/;
const RGB_COLOR_RE = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+))?\s*\)$/;
const FALLBACK_COLOR = "#888888";

export function sanitizeColor(color: string): string {
  if (!color || typeof color !== "string") return FALLBACK_COLOR;
  const trimmed = color.trim();
  if (HEX_COLOR_RE.test(trimmed)) return trimmed;
  if (RGB_COLOR_RE.test(trimmed)) return trimmed;
  return FALLBACK_COLOR;
}
