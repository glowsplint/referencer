export function parseHexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Background colors for alpha blending
const LIGHT_BG = { r: 255, g: 255, b: 255 } // --white
const DARK_BG = { r: 14, g: 14, b: 17 } // --black (#0e0e11)

export function blendWithBackground(hex: string, alpha: number, isDarkMode: boolean): string {
  const fg = {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  }
  const bg = isDarkMode ? DARK_BG : LIGHT_BG
  const blend = (f: number, b: number) => Math.round(f * alpha + b * (1 - alpha))
  return `rgb(${blend(fg.r, bg.r)}, ${blend(fg.g, bg.g)}, ${blend(fg.b, bg.b)})`
}
