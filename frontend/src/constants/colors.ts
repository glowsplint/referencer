/** Fallback color when no layer is active (Tailwind blue-500). */
export const DEFAULT_LAYER_COLOR = "#3b82f6";
/** Dark-mode counterpart (Tailwind blue-400). */
export const DEFAULT_LAYER_COLOR_DARK = "#60a5fa";

/**
 * Tailwind 300-shade palette used for layer colors.
 * Ordered for maximum perceptual separation in the first few auto-assigned slots.
 * Confusable pairs (rose/red, pink/fuchsia, emerald/green) have been removed.
 */
export const TAILWIND_300_COLORS = [
  "#fca5a5", // red-300     (warm red)
  "#93c5fd", // blue-300    (cool blue)
  "#86efac", // green-300   (green)
  "#fdba74", // orange-300  (warm orange)
  "#c4b5fd", // violet-300  (purple)
  "#67e8f9", // cyan-300    (cyan)
  "#fcd34d", // amber-300
  "#f0abfc", // fuchsia-300
  "#5eead4", // teal-300
  "#bef264", // lime-300
  "#7dd3fc", // sky-300
  "#a5b4fc", // indigo-300
  "#d8b4fe", // purple-300
  "#fde047", // yellow-300
  "#d4d4d8", // zinc-300
];
