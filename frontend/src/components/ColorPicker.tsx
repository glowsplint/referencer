import { useRef } from "react";
import { Plus, X } from "lucide-react";
import { TAILWIND_300_COLORS } from "@/types/editor";

interface ColorPickerProps {
  index: number;
  onSelectColor: (color: string) => void;
  customColors?: string[];
  onAddCustomColor?: (hex: string) => void;
  onRemoveCustomColor?: (hex: string) => void;
}

export function ColorPicker({
  index,
  onSelectColor,
  customColors = [],
  onAddCustomColor,
  onRemoveCustomColor,
}: ColorPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="p-2 mt-1 rounded border border-border bg-popover"
      data-testid={`colorPicker-${index}`}
    >
      <div className="grid grid-cols-6 gap-1">
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
      {(customColors.length > 0 || onAddCustomColor) && (
        <div className="flex flex-wrap items-center gap-1 mt-2 pt-2 border-t border-border">
          {customColors.map((color) => (
            <div key={color} className="relative group">
              <button
                className="w-5 h-5 rounded-full border border-black/10 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                onClick={() => onSelectColor(color)}
                title={color}
                data-testid={`customColorOption-${color}`}
              />
              {onRemoveCustomColor && (
                <button
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-background border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveCustomColor(color);
                  }}
                  title="Remove custom color"
                  data-testid={`removeCustomColor-${color}`}
                >
                  <X size={8} />
                </button>
              )}
            </div>
          ))}
          {onAddCustomColor && (
            <>
              <button
                className="w-5 h-5 rounded-full border border-dashed border-muted-foreground/50 flex items-center justify-center hover:border-muted-foreground transition-colors cursor-pointer"
                onClick={() => inputRef.current?.click()}
                title="Add custom color"
                data-testid="addCustomColorButton"
              >
                <Plus size={10} className="text-muted-foreground" />
              </button>
              <input
                ref={inputRef}
                type="color"
                className="sr-only"
                data-testid="customColorInput"
                onChange={(e) => {
                  const hex = e.target.value;
                  onAddCustomColor(hex);
                  onSelectColor(hex);
                }}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
