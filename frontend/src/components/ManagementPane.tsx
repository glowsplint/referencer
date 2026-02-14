import { useState } from "react";
import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { LayerRow } from "./LayerRow";
import { SectionList } from "./SectionList";
import { DRAG_TYPE_LAYER, DRAG_TYPE_SECTION } from "@/constants/drag-types";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export function ManagementPane() {
  const {
    layers,
    activeLayerId,
    editorCount,
    sectionVisibility,
    sectionNames,
    addLayer,
    removeLayer,
    setActiveLayer,
    updateLayerColor,
    updateLayerName,
    toggleLayerVisibility,
    toggleAllLayerVisibility,
    removeHighlight,
    removeArrow,
    addEditor,
    removeEditor,
    reorderEditors,
    updateSectionName,
    toggleSectionVisibility,
    toggleAllSectionVisibility,
  } = useWorkspace();

  const [dragOver, setDragOver] = useState(false);

  const hasVisibleLayers = layers.some((l) => l.visible);

  const handleDropOnTrash = (e: React.DragEvent) => {
    e.preventDefault();
    const layerId = e.dataTransfer.getData(DRAG_TYPE_LAYER);
    if (layerId) removeLayer(layerId);
    const sectionIndex = e.dataTransfer.getData(DRAG_TYPE_SECTION);
    if (sectionIndex !== "") removeEditor(Number(sectionIndex));
    setDragOver(false);
  };

  return (
    <div
      className="shrink-0 h-full overflow-y-auto p-3 w-[250px] border-r border-border"
      data-testid="managementPane"
    >
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-xs font-medium text-muted-foreground">
            Layers
          </h3>
          <div className="flex items-center gap-1">
            <button
              className="p-0.5 rounded hover:bg-accent text-muted-foreground shrink-0 cursor-pointer"
              onClick={addLayer}
              title="Add layer"
              data-testid="addLayerButton"
            >
              <Plus size={14} />
            </button>
            <button
              className="p-0.5 rounded hover:bg-accent text-muted-foreground shrink-0 cursor-pointer"
              onClick={toggleAllLayerVisibility}
              title={hasVisibleLayers ? "Hide all layers" : "Show all layers"}
              data-testid="toggleAllLayerVisibility"
            >
              {hasVisibleLayers ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {layers.map((layer, index) => (
            <LayerRow
              key={layer.id}
              layer={layer}
              index={index}
              isActive={layer.id === activeLayerId}
              onSetActive={() => setActiveLayer(layer.id)}
              sectionNames={sectionNames}
              onUpdateColor={(color) => updateLayerColor(layer.id, color)}
              onUpdateName={(name) => updateLayerName(layer.id, name)}
              onToggleVisibility={() => toggleLayerVisibility(layer.id)}
              onRemoveHighlight={removeHighlight}
              onRemoveArrow={removeArrow}
            />
          ))}
        </div>
      </div>

      <SectionList
        editorCount={editorCount}
        sectionVisibility={sectionVisibility}
        sectionNames={sectionNames}
        addEditor={addEditor}
        onUpdateName={updateSectionName}
        onReorder={reorderEditors}
        toggleSectionVisibility={toggleSectionVisibility}
        toggleAllSectionVisibility={toggleAllSectionVisibility}
      />

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
          onDrop={handleDropOnTrash}
        >
          <Trash2 size={16} />
        </div>
      )}
    </div>
  );
}
