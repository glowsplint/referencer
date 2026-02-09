import { Eye, EyeOff, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SectionListProps {
  editorCount: number;
  sectionVisibility: boolean[];
  sectionNames: string[];
  addEditor: () => void;
  removeEditor: (index: number) => void;
  onUpdateName: (index: number, name: string) => void;
  toggleSectionVisibility: (index: number) => void;
  toggleAllSectionVisibility: () => void;
}

export function SectionList({
  editorCount,
  sectionVisibility,
  sectionNames,
  addEditor,
  removeEditor,
  onUpdateName,
  toggleSectionVisibility,
  toggleAllSectionVisibility,
}: SectionListProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingIndex !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingIndex]);

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditingValue(sectionNames[index]);
  };

  const commitEdit = (index: number) => {
    const trimmed = editingValue.trim();
    onUpdateName(index, trimmed || sectionNames[index]);
    setEditingIndex(null);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-xs font-medium text-muted-foreground">
          Passages
        </h3>
        <div className="flex items-center gap-1">
          <button
            className="p-0.5 rounded hover:bg-accent text-muted-foreground shrink-0 cursor-pointer"
            onClick={addEditor}
            title="Add passage"
            data-testid="addPassageButton"
          >
            <Plus size={14} />
          </button>
          <button
            className="p-0.5 rounded hover:bg-accent text-muted-foreground shrink-0 cursor-pointer"
            onClick={toggleAllSectionVisibility}
            title={sectionVisibility.some(Boolean) ? "Hide all passages" : "Show all passages"}
            data-testid="toggleAllSectionVisibility"
          >
            {sectionVisibility.some(Boolean) ? (
              <Eye size={14} />
            ) : (
              <EyeOff size={14} />
            )}
          </button>
        </div>
      </div>
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
            {editingIndex === i ? (
              <input
                ref={editInputRef}
                className="text-sm w-full bg-transparent border-0 ring-1 ring-border rounded px-1 py-0 outline-none"
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onBlur={() => commitEdit(i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitEdit(i);
                  if (e.key === "Escape") cancelEdit();
                }}
                data-testid={`passageNameInput-${i}`}
              />
            ) : (
              <div
                className="text-sm flex-1 bg-transparent border-0 rounded px-1 py-0 truncate cursor-default"
                onDoubleClick={() => startEditing(i)}
                data-testid={`passageName-${i}`}
              >
                {sectionNames[i]}
              </div>
            )}
            <button
              className="p-0.5 rounded hover:bg-accent text-muted-foreground shrink-0 cursor-pointer"
              onClick={() => toggleSectionVisibility(i)}
              title={sectionVisibility[i] ? "Hide passage" : "Show passage"}
              data-testid={`sectionVisibility-${i}`}
            >
              {sectionVisibility[i] ? (
                <Eye size={14} />
              ) : (
                <EyeOff size={14} />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
