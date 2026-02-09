import { ColorPicker } from "./ColorPicker";
import { useEffect, useRef, useState } from "react";

import type { Layer } from "@/types/editor";

interface LayerRowProps {
  layer: Layer;
  index: number;
  isActive: boolean;
  onSetActive: () => void;
  onUpdateColor: (color: string) => void;
  onUpdateName: (name: string) => void;
}

export function LayerRow({
  layer,
  index,
  isActive,
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
    <div
      className="relative cursor-grab"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", layer.id);
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
            className="text-sm w-full bg-transparent border-0 rounded px-1 py-0 truncate"
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
