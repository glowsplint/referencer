import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { X, Plus, Check } from "lucide-react";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { TAILWIND_300_COLORS } from "@/types/editor";
import { hexToRgb, rgbToHex } from "@/lib/color";

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
  const { t } = useTranslation("management");
  const [showAdvancedPicker, setShowAdvancedPicker] = useState(false);
  const [pickerColor, setPickerColor] = useState("#000000");

  const showCustomSection =
    (customColors && customColors.length > 0) || onAddCustomColor;

  const handleColorChange = useCallback((hex: string) => {
    setPickerColor(hex);
  }, []);

  const handleRgbChange = useCallback(
    (channel: "r" | "g" | "b", value: number) => {
      const current = hexToRgb(pickerColor);
      current[channel] = value;
      setPickerColor(rgbToHex(current.r, current.g, current.b));
    },
    [pickerColor],
  );

  const handleConfirm = useCallback(() => {
    onSelectColor(pickerColor);
    onAddCustomColor?.(pickerColor);
    setShowAdvancedPicker(false);
  }, [onSelectColor, onAddCustomColor, pickerColor]);

  const rgb = hexToRgb(pickerColor);

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
                    title={t("annotations.removeCustomColour")}
                    data-testid={`removeCustomColor-${color}`}
                  >
                    <X size={8} />
                  </button>
                )}
              </div>
            ))}
            {onAddCustomColor && (
              <button
                className="w-5 h-5 rounded-full border-2 border-dashed border-muted-foreground/40 hover:border-muted-foreground flex items-center justify-center transition-colors cursor-pointer"
                onClick={() => setShowAdvancedPicker((prev) => !prev)}
                title={t("annotations.addCustomColour")}
                data-testid={`addCustomColor-${index}`}
              >
                <Plus size={10} className="text-muted-foreground" />
              </button>
            )}
          </div>
          {showAdvancedPicker && onAddCustomColor && (
            <div className="mt-2 space-y-2" data-testid={`advancedPicker-${index}`}>
              <HexColorPicker color={pickerColor} onChange={handleColorChange} />
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border border-black/10 shrink-0"
                  style={{ backgroundColor: pickerColor }}
                  data-testid={`pickerPreview-${index}`}
                />
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>#</span>
                  <HexColorInput
                    color={pickerColor}
                    onChange={handleColorChange}
                    className="w-16 bg-transparent border border-border rounded px-1 py-0.5 text-xs text-foreground font-mono"
                    data-testid={`hexInput-${index}`}
                  />
                </div>
              </div>
              <div className="flex gap-1">
                {(["r", "g", "b"] as const).map((ch) => (
                  <label key={ch} className="flex flex-col items-center gap-0.5 text-[10px] text-muted-foreground uppercase">
                    {ch}
                    <input
                      type="number"
                      min={0}
                      max={255}
                      value={rgb[ch]}
                      onChange={(e) => handleRgbChange(ch, Number(e.target.value))}
                      className="w-12 bg-transparent border border-border rounded px-1 py-0.5 text-xs text-foreground text-center font-mono"
                      data-testid={`rgbInput-${ch}-${index}`}
                    />
                  </label>
                ))}
              </div>
              <button
                onClick={handleConfirm}
                className="w-full flex items-center justify-center gap-1 text-xs py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                data-testid={`confirmColor-${index}`}
              >
                <Check size={12} />
                {t("annotations.addToCustomColours")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
