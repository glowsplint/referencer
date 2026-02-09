import { useState } from "react";
import { Trash2 } from "lucide-react";
import { LayerRow } from "./LayerRow";
import { SectionList } from "./SectionList";

import type { Layer } from "@/types/editor";

interface ManagementPaneProps {
  layers: Layer[];
  activeLayerId: string | null;
  editorCount: number;
  removeLayer: (id: string) => void;
  setActiveLayer: (id: string) => void;
  updateLayerColor: (id: string, color: string) => void;
  updateLayerName: (id: string, name: string) => void;
  toggleLayerVisibility: (id: string) => void;
  removeEditor: (index: number) => void;
}

export function ManagementPane({
  layers,
  activeLayerId,
  editorCount,
  removeLayer,
  setActiveLayer,
  updateLayerColor,
  updateLayerName,
  toggleLayerVisibility,
  removeEditor,
}: ManagementPaneProps) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      className="shrink-0 h-full overflow-y-auto p-3 w-[250px] border-r border-border"
      data-testid="managementPane"
    >
      <div className="mb-4">
        <h3 className="text-xs font-medium text-muted-foreground mb-2">
          Layers
        </h3>
        {layers.length === 0 && (
          <p className="text-xs text-muted-foreground/60">No layers</p>
        )}
        <div className="flex flex-col gap-1">
          {layers.map((layer, index) => (
            <LayerRow
              key={layer.id}
              layer={layer}
              index={index}
              isActive={layer.id === activeLayerId}
              onSetActive={() => setActiveLayer(layer.id)}
              onUpdateColor={(color) => updateLayerColor(layer.id, color)}
              onUpdateName={(name) => updateLayerName(layer.id, name)}
              onToggleVisibility={() => toggleLayerVisibility(layer.id)}
            />
          ))}
        </div>
      </div>

      <SectionList editorCount={editorCount} removeEditor={removeEditor} />

      {(layers.length > 0 || editorCount > 1) && (
        <div
          className={`mt-4 flex items-center justify-center rounded border-2 border-dashed py-2 transition-colors ${
            dragOver
              ? "border-destructive text-destructive"
              : "border-muted-foreground/30 text-muted-foreground/40"
          }`}
          data-testid="trashBin"
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={() => setDragOver(true)}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            const layerId = e.dataTransfer.getData("application/x-layer-id");
            if (layerId) {
              removeLayer(layerId);
            }
            const sectionIndex = e.dataTransfer.getData(
              "application/x-section-index"
            );
            if (sectionIndex !== "") {
              removeEditor(Number(sectionIndex));
            }
            setDragOver(false);
          }}
        >
          <Trash2 size={16} />
        </div>
      )}
    </div>
  );
}
