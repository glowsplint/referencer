// Dropdown picker for arrow line styles (solid, dashed, dotted, double).
// Shown as a popover next to the arrow tool button in the ButtonPane.
import type { ArrowStyle } from "@/types/editor";
import { ARROW_STYLES } from "@/lib/arrow-styles";

interface ArrowStylePickerProps {
  index: number;
  activeStyle: ArrowStyle;
  color: string;
  onSelectStyle: (style: ArrowStyle) => void;
}

function StylePreview({ style, color }: { style: ArrowStyle; color: string }) {
  if (style === "double") {
    return (
      <svg width="32" height="12" viewBox="0 0 32 12" className="shrink-0">
        <line x1="2" y1="4" x2="30" y2="4" stroke={color} strokeWidth={1} />
        <line x1="2" y1="8" x2="30" y2="8" stroke={color} strokeWidth={1} />
      </svg>
    );
  }

  const dasharray =
    style === "dashed" ? "8 4" : style === "dotted" ? "2 4" : undefined;

  return (
    <svg width="32" height="12" viewBox="0 0 32 12" className="shrink-0">
      <line
        x1="2"
        y1="6"
        x2="30"
        y2="6"
        stroke={color}
        strokeWidth={2}
        strokeDasharray={dasharray}
      />
    </svg>
  );
}

export function ArrowStylePicker({
  index,
  activeStyle,
  color,
  onSelectStyle,
}: ArrowStylePickerProps) {
  return (
    <div
      className="p-1 mt-1 rounded border border-border bg-popover"
      data-testid={`arrowStylePicker-${index}`}
    >
      {ARROW_STYLES.map(({ value, label }) => (
        <button
          key={value}
          className={`flex items-center gap-2 w-full px-2 py-1 rounded text-sm cursor-pointer ${
            value === activeStyle ? "bg-accent" : "hover:bg-accent/50"
          }`}
          onClick={() => onSelectStyle(value)}
          data-testid={`arrowStyleOption-${value}`}
        >
          <StylePreview style={value} color={color} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
