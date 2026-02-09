import { Eye, EyeOff } from "lucide-react";
import { ColorPicker } from "./ColorPicker";
import { useState } from "react";
import { DRAG_TYPE_LAYER } from "@/constants/drag-types";
import { useInlineEdit } from "@/hooks/use-inline-edit";

import type { Layer } from "@/types/editor";

interface LayerRowProps {
  layer: Layer;
  index: number;
  isActive: boolean;
  onSetActive: () => void;
  onUpdateColor: (color: string) => void;
  onUpdateName: (name: string) => void;
  onToggleVisibility: () => void;
}

export function LayerRow({
  layer,
  index,
  isActive,
  onSetActive,
  onUpdateColor,
  onUpdateName,
  onToggleVisibility,
}: LayerRowProps) {
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const { isEditing, inputProps, startEditing } = useInlineEdit({
    currentName: layer.name,
    onCommit: onUpdateName,
  });

  return (
    <div
      className="relative cursor-grab"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG_TYPE_LAYER, layer.id);
      }}
    >
      <div
        className={`flex items-center gap-2 px-1 py-0.5 rounded ${isActive ? "bg-accent" : "hover:bg-accent/50"}`}
        onClick={onSetActive}
      >
        <button
          className="w-5 h-5 rounded-full border-2 border-black/10 hover:border-black/30 shrink-0 transition-colors cursor-pointer"
          style={{ backgroundColor: layer.color }}
          onClick={(e) => {
            e.stopPropagation();
            setColorPickerOpen(!colorPickerOpen);
          }}
          title="Change colour"
          data-testid={`layerSwatch-${index}`}
        />
        {isEditing ? (
          <input
            {...inputProps}
            className="text-sm w-full bg-transparent border-0 ring-1 ring-border rounded px-1 py-0 outline-none"
            data-testid={`layerNameInput-${index}`}
          />
        ) : (
          <div
            className="text-sm w-full bg-transparent border-0 rounded px-1 py-0 truncate cursor-default"
            onDoubleClick={(e) => {
              e.stopPropagation();
              startEditing();
            }}
            data-testid={`layerName-${index}`}
          >
            {layer.name}
          </div>
        )}
        {isActive && (
          <span
            className="text-[10px] font-medium text-muted-foreground shrink-0"
            data-testid={`layerActiveTag-${index}`}
          >
            Active
          </span>
        )}
        <button
          className="p-0.5 rounded hover:bg-accent text-muted-foreground shrink-0 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
          title={layer.visible ? "Hide layer" : "Show layer"}
          data-testid={`layerVisibility-${index}`}
        >
          {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
      </div>
      {colorPickerOpen && (
        <ColorPicker
          layerId={layer.id}
          index={index}
          onSelectColor={(color) => {
            onUpdateColor(color);
            setColorPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}
