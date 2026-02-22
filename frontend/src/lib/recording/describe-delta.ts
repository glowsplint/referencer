import type { Layer } from "@/types/editor";

/**
 * Produces a human-readable description of a recording delta.
 * `t` is the i18n translate function scoped to the "tools" namespace.
 */
export function describeDelta(
  delta: Record<string, boolean>,
  layers: Layer[],
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  const parts: string[] = [];
  for (const [key, visible] of Object.entries(delta)) {
    if (key.startsWith("layer:")) {
      const id = key.slice("layer:".length);
      const name = layers.find((l) => l.id === id)?.name ?? "Unknown";
      parts.push(
        visible
          ? t("recording.showLayer", { name })
          : t("recording.hideLayer", { name }),
      );
    } else if (key.startsWith("section:")) {
      const idx = Number(key.slice("section:".length));
      parts.push(
        visible
          ? t("recording.showSection", { index: idx + 1 })
          : t("recording.hideSection", { index: idx + 1 }),
      );
    } else {
      parts.push(visible ? t("recording.showAnnotation") : t("recording.hideAnnotation"));
    }
  }
  return parts.join(", ") || "No changes";
}
