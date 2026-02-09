import { X } from "lucide-react";

interface SectionListProps {
  editorCount: number;
  removeEditor: (index: number) => void;
}

export function SectionList({ editorCount, removeEditor }: SectionListProps) {
  return (
    <div>
      <h3 className="text-xs font-medium text-muted-foreground mb-2">
        Sections
      </h3>
      <div className="flex flex-col gap-1">
        {Array.from({ length: editorCount }, (_, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-1 py-0.5 rounded hover:bg-accent/50 cursor-grab"
            draggable={editorCount > 1}
            onDragStart={(e) => {
              e.dataTransfer.setData("application/x-section-index", String(i));
            }}
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
  );
}
