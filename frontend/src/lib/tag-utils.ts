export const TAG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const MAX_TAG_LENGTH = 50;
export const MAX_TAGS_PER_DOC = 20;

export function normalizeTag(raw: string): string {
  return raw.replace(/^#/, "").trim().toLowerCase();
}

export function isValidTag(tag: string): boolean {
  const normalized = normalizeTag(tag);
  return normalized.length > 0 && normalized.length <= MAX_TAG_LENGTH && TAG_RE.test(normalized);
}
