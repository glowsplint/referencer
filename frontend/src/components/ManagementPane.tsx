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
  removeEditor,
}: ManagementPaneProps) {
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
              onRemove={() => removeLayer(layer.id)}
              onSetActive={() => setActiveLayer(layer.id)}
              onUpdateColor={(color) => updateLayerColor(layer.id, color)}
              onUpdateName={(name) => updateLayerName(layer.id, name)}
            />
          ))}
        </div>
      </div>

      <SectionList editorCount={editorCount} removeEditor={removeEditor} />
    </div>
  );
}
