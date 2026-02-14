import { Eye, EyeOff, ChevronRight, ChevronDown, MessageSquareText, Highlighter, ArrowRight, X } from "lucide-react";
import { ColorPicker } from "./ColorPicker";
import { ArrowStylePicker } from "./ArrowStylePicker";
import { useState } from "react";
import { DRAG_TYPE_LAYER } from "@/constants/drag-types";
import { useInlineEdit } from "@/hooks/use-inline-edit";

import type { Layer, ArrowStyle } from "@/types/editor";

interface LayerRowProps {
  layer: Layer;
  index: number;
  isActive: boolean;
  sectionNames: string[];
  onSetActive: () => void;
  onUpdateColor: (color: string) => void;
  onUpdateArrowStyle: (style: ArrowStyle) => void;
  onUpdateName: (name: string) => void;
  onToggleVisibility: () => void;
  onRemoveHighlight: (layerId: string, highlightId: string) => void;
  onRemoveArrow: (layerId: string, arrowId: string) => void;
  customColors?: string[];
  onAddCustomColor?: (hex: string) => void;
  onRemoveCustomColor?: (hex: string) => void;
}

export function LayerRow({
  layer,
  index,
  isActive,
  sectionNames,
  onSetActive,
  onUpdateColor,
  onUpdateArrowStyle,
  onUpdateName,
  onToggleVisibility,
  onRemoveHighlight,
  onRemoveArrow,
  customColors,
  onAddCustomColor,
  onRemoveCustomColor,
}: LayerRowProps) {
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [arrowStylePickerOpen, setArrowStylePickerOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { isEditing, inputProps, startEditing } = useInlineEdit({
    currentName: layer.name,
    onCommit: onUpdateName,
  });

  const itemCount = layer.highlights.length + layer.arrows.length;
  const hasItems = itemCount > 0;

  return (
    <div
      className="relative cursor-grab"
      draggable
      data-testid="layerRow"
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG_TYPE_LAYER, layer.id);
      }}
    >
      <div
        className={`flex items-center gap-2 px-1 py-0.5 rounded ${isActive ? "bg-accent" : "hover:bg-accent/50"}`}
        onClick={onSetActive}
      >
        {hasItems ? (
          <button
            className="p-0 text-muted-foreground shrink-0 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            data-testid={`layerExpand-${index}`}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="w-[14px] shrink-0" />
        )}
        <button
          className="w-5 h-5 rounded-full border-2 border-black/10 hover:border-black/30 shrink-0 transition-colors cursor-pointer"
          style={{ backgroundColor: layer.color }}
          onClick={(e) => {
            e.stopPropagation();
            setArrowStylePickerOpen(false);
            setColorPickerOpen(!colorPickerOpen);
          }}
          title="Change colour"
          data-testid={`layerSwatch-${index}`}
        />
        <button
          className="shrink-0 cursor-pointer rounded hover:bg-accent/50 p-0.5 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setColorPickerOpen(false);
            setArrowStylePickerOpen(!arrowStylePickerOpen);
          }}
          title="Change arrow style"
          data-testid={`layerArrowStyle-${index}`}
        >
          <svg width="16" height="10" viewBox="0 0 16 10" className="block">
            {layer.arrowStyle === "double" ? (
              <>
                <line x1="1" y1="3" x2="15" y2="3" stroke={layer.color} strokeWidth={1} />
                <line x1="1" y1="7" x2="15" y2="7" stroke={layer.color} strokeWidth={1} />
              </>
            ) : (
              <line
                x1="1"
                y1="5"
                x2="15"
                y2="5"
                stroke={layer.color}
                strokeWidth={2}
                strokeDasharray={
                  layer.arrowStyle === "dashed" ? "4 2" :
                  layer.arrowStyle === "dotted" ? "1.5 2" :
                  undefined
                }
              />
            )}
          </svg>
        </button>
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
        {hasItems && !expanded && (
          <span
            className="text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-1.5 shrink-0"
            data-testid={`layerItemCount-${index}`}
          >
            {itemCount}
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
          index={index}
          onSelectColor={(color) => {
            onUpdateColor(color);
            setColorPickerOpen(false);
          }}
          customColors={customColors}
          onAddCustomColor={onAddCustomColor}
          onRemoveCustomColor={onRemoveCustomColor}
        />
      )}
      {arrowStylePickerOpen && (
        <ArrowStylePicker
          index={index}
          activeStyle={layer.arrowStyle ?? "solid"}
          color={layer.color}
          onSelectStyle={(style) => {
            onUpdateArrowStyle(style);
            setArrowStylePickerOpen(false);
          }}
        />
      )}
      {expanded && hasItems && (
        <div className="ml-[14px] pl-2 border-l border-border" data-testid={`layerItems-${index}`}>
          {layer.highlights.map((h) => {
            const passageName = sectionNames[h.editorIndex] ?? `Passage ${h.editorIndex + 1}`;
            const label = h.annotation || h.text;
            const fullTitle = `${label} (${passageName})`;
            return (
              <div
                key={h.id}
                className="group flex items-center gap-1.5 pt-2.5 px-1 text-xs text-muted-foreground"
                data-testid={`layerHighlight-${h.id}`}
              >
                {h.type === "comment" ? <MessageSquareText size={12} className="shrink-0" /> : <Highlighter size={12} className="shrink-0" />}
                <span className="truncate" title={fullTitle}>{label}</span>
                <button
                  className="ml-auto p-0 shrink-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  onClick={() => onRemoveHighlight(layer.id, h.id)}
                  title="Remove annotation"
                  data-testid={`removeHighlight-${h.id}`}
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
          {layer.arrows.map((a) => {
            const fromName = sectionNames[a.from.editorIndex] ?? `Passage ${a.from.editorIndex + 1}`;
            const toName = sectionNames[a.to.editorIndex] ?? `Passage ${a.to.editorIndex + 1}`;
            const label = `${a.from.text} \u2192 ${a.to.text}`;
            const fullTitle = `${a.from.text} (${fromName}) \u2192 ${a.to.text} (${toName})`;
            return (
              <div
                key={a.id}
                className="group flex items-center gap-1.5 pt-2.5 px-1 text-xs text-muted-foreground"
                data-testid={`layerArrow-${a.id}`}
              >
                <ArrowRight size={12} className="shrink-0" />
                <span className="truncate" title={fullTitle}>{label}</span>
                <button
                  className="ml-auto p-0 shrink-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  onClick={() => onRemoveArrow(layer.id, a.id)}
                  title="Remove arrow"
                  data-testid={`removeArrow-${a.id}`}
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
