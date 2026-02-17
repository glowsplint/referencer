import { useRef } from "react";
import { X, Plus } from "lucide-react";
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
  customColors,
  onAddCustomColor,
  onRemoveCustomColor,
}: ColorPickerProps) {
  const colorInputRef = useRef<HTMLInputElement>(null);

  const showCustomSection =
    (customColors && customColors.length > 0) || onAddCustomColor;

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
      {showCustomSection && (
        <>
          <hr className="my-2 border-border" data-testid={`customColorSeparator-${index}`} />
          <div className="grid grid-cols-6 gap-1">
            {customColors?.map((color) => (
              <div key={color} className="group relative">
                <button
                  className="w-5 h-5 rounded-full border border-black/10 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => onSelectColor(color)}
                  title={color}
                  data-testid={`customColor-${color}`}
                />
                {onRemoveCustomColor && (
                  <button
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveCustomColor(color);
                    }}
                    title="Remove custom colour"
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
                  className="w-5 h-5 rounded-full border-2 border-dashed border-muted-foreground/40 hover:border-muted-foreground flex items-center justify-center transition-colors cursor-pointer"
                  onClick={() => colorInputRef.current?.click()}
                  title="Add custom colour"
                  data-testid={`addCustomColor-${index}`}
                >
                  <Plus size={10} className="text-muted-foreground" />
                </button>
                <input
                  ref={colorInputRef}
                  type="color"
                  className="sr-only"
                  data-testid={`colorInput-${index}`}
                  onChange={(e) => {
                    const hex = e.target.value;
                    onAddCustomColor(hex);
                    onSelectColor(hex);
                  }}
                />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
