import { TAILWIND_300_COLORS } from "@/types/editor";

interface ColorPickerProps {
  layerId: string;
  index: number;
  onSelectColor: (color: string) => void;
}

export function ColorPicker({
  index,
  onSelectColor,
}: ColorPickerProps) {
  return (
    <div
      className="grid grid-cols-5 gap-1 p-2 mt-1 rounded border border-border bg-popover"
      data-testid={`colorPicker-${index}`}
    >
      {TAILWIND_300_COLORS.map((color) => (
        <button
          key={color}
          className="w-5 h-5 rounded-full border border-black/10 hover:scale-110 transition-transform"
          style={{ backgroundColor: color }}
          onClick={() => onSelectColor(color)}
          title={color}
          data-testid={`colorOption-${color}`}
        />
      ))}
    </div>
  );
}
