import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { ColorPicker } from "./ColorPicker";

import type { Layer } from "@/types/editor";

interface LayerRowProps {
  layer: Layer;
  index: number;
  isActive: boolean;
  onRemove: () => void;
  onSetActive: () => void;
  onUpdateColor: (color: string) => void;
  onUpdateName: (name: string) => void;
}

export function LayerRow({
  layer,
  index,
  isActive,
  onRemove,
  onSetActive,
  onUpdateColor,
  onUpdateName,
}: LayerRowProps) {
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingValue, setEditingValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editing]);

  const startEditing = () => {
    setEditing(true);
    setEditingValue(layer.name);
  };

  const commitEdit = () => {
    const trimmed = editingValue.trim();
    onUpdateName(trimmed || layer.name);
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-2 px-1 py-0.5 rounded ${isActive ? "bg-accent" : "hover:bg-accent/50"}`}
        onClick={onSetActive}
      >
        <button
          className="w-5 h-5 rounded-full border-2 border-black/10 hover:border-black/30 shrink-0 transition-colors cursor-pointer"
          style={{ backgroundColor: layer.color }}
          onClick={(e) => { e.stopPropagation(); setColorPickerOpen(!colorPickerOpen); }}
          title="Change colour"
          data-testid={`layerSwatch-${index}`}
        />
        {editing ? (
          <input
            ref={editInputRef}
            className="text-sm w-full bg-transparent border-0 ring-1 ring-border rounded px-1 py-0 outline-none"
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") cancelEdit();
            }}
            data-testid={`layerNameInput-${index}`}
          />
        ) : (
          <div
            className="text-sm w-auto bg-transparent border-0 ring-1 ring-transparent hover:ring-border rounded px-1 py-0 cursor-text whitespace-nowrap"
            onClick={(e) => { e.stopPropagation(); startEditing(); }}
            data-testid={`layerName-${index}`}
          >
            {layer.name}
          </div>
        )}
        <div
          className="w-full h-auto self-stretch"
          data-testid={`layerRowSpacer-${index}`}
        />
        {isActive && (
          <span
            className="text-[10px] font-medium text-muted-foreground shrink-0"
            data-testid={`layerActiveTag-${index}`}
          >
            Active
          </span>
        )}
        <button
          className="p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive shrink-0"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          title="Remove layer"
          data-testid={`removeLayer-${index}`}
        >
          <X size={14} />
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
