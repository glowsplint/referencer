// Color utilities for alpha compositing and theme-aware blending.
// Used to render overlapping annotation highlights as opaque RGB colors
// that look correct on both light and dark backgrounds.

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[clamp(r), clamp(g), clamp(b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export function parseHexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Background colors for alpha blending
const LIGHT_BG = { r: 255, g: 255, b: 255 }; // --white
const DARK_BG = { r: 14, g: 14, b: 17 }; // --black (#0e0e11)

export function blendWithBackground(hex: string, alpha: number, isDarkMode: boolean): string {
  const fg = hexToRgb(hex);
  const bg = isDarkMode ? DARK_BG : LIGHT_BG;
  const blend = (f: number, b: number) => Math.round(f * alpha + b * (1 - alpha));
  return `rgb(${blend(fg.r, bg.r)}, ${blend(fg.g, bg.g)}, ${blend(fg.b, bg.b)})`;
}

/**
 * Blend multiple colors via sequential alpha compositing onto the page background.
 * Entries are sorted by hex+opacity for deterministic results.
 */
export function blendColors(
  entries: { hex: string; opacity: number }[],
  isDarkMode: boolean,
): string {
  if (entries.length === 0) {
    const bg = isDarkMode ? DARK_BG : LIGHT_BG;
    return `rgb(${bg.r}, ${bg.g}, ${bg.b})`;
  }
  if (entries.length === 1) {
    return blendWithBackground(entries[0].hex, entries[0].opacity, isDarkMode);
  }

  // Sort for deterministic blending order
  const sorted = [...entries].sort((a, b) =>
    a.hex < b.hex ? -1 : a.hex > b.hex ? 1 : a.opacity - b.opacity,
  );

  // Start with page background
  const bg = isDarkMode ? DARK_BG : LIGHT_BG;
  let r = bg.r;
  let g = bg.g;
  let b = bg.b;

  // Sequentially composite each color
  for (const { hex, opacity } of sorted) {
    const fg = hexToRgb(hex);
    r = Math.round(fg.r * opacity + r * (1 - opacity));
    g = Math.round(fg.g * opacity + g * (1 - opacity));
    b = Math.round(fg.b * opacity + b * (1 - opacity));
  }

  return `rgb(${r}, ${g}, ${b})`;
}
