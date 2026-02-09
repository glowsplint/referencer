import { useState } from "react"
import { X } from "lucide-react"
import type { Layer } from "@/types/editor"
import { TAILWIND_300_COLORS } from "@/types/editor"

interface ManagementPaneProps {
  layers: Layer[]
  editorCount: number
  removeLayer: (id: string) => void
  updateLayerColor: (id: string, color: string) => void
  removeEditor: (index: number) => void
}

export function ManagementPane({
  layers,
  editorCount,
  removeLayer,
  updateLayerColor,
  removeEditor,
}: ManagementPaneProps) {
  const [colorPickerLayerId, setColorPickerLayerId] = useState<string | null>(
    null
  )

  return (
    <div
      className="w-[200px] shrink-0 border-r border-border h-full overflow-y-auto p-3"
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
            <div key={layer.id} className="relative">
              <div className="flex items-center gap-2 px-1 py-0.5 rounded hover:bg-accent/50">
                <button
                  className="w-5 h-5 rounded-full border border-black/10 shrink-0"
                  style={{ backgroundColor: layer.color }}
                  onClick={() =>
                    setColorPickerLayerId(
                      colorPickerLayerId === layer.id ? null : layer.id
                    )
                  }
                  title="Change colour"
                  data-testid={`layerSwatch-${index}`}
                />
                <span className="text-sm flex-1 truncate">
                  Layer {index + 1}
                </span>
                <button
                  className="p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                  onClick={() => removeLayer(layer.id)}
                  title="Remove layer"
                  data-testid={`removeLayer-${index}`}
                >
                  <X size={14} />
                </button>
              </div>
              {colorPickerLayerId === layer.id && (
                <div
                  className="grid grid-cols-5 gap-1 p-2 mt-1 rounded border border-border bg-popover"
                  data-testid={`colorPicker-${index}`}
                >
                  {TAILWIND_300_COLORS.map((color) => (
                    <button
                      key={color}
                      className="w-5 h-5 rounded-full border border-black/10 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        updateLayerColor(layer.id, color)
                        setColorPickerLayerId(null)
                      }}
                      title={color}
                      data-testid={`colorOption-${color}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-medium text-muted-foreground mb-2">
          Sections
        </h3>
        <div className="flex flex-col gap-1">
          {Array.from({ length: editorCount }, (_, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-1 py-0.5 rounded hover:bg-accent/50"
            >
              <span className="text-sm flex-1">Section {i + 1}</span>
              {editorCount > 1 && (
                <button
                  className="p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                  onClick={() => removeEditor(i)}
                  title="Remove section"
                  data-testid={`removeSection-${i}`}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
