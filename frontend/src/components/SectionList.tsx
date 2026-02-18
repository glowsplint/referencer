// Passage list in the management pane. Each passage row has an inline-editable
// name and visibility toggle. Supports drag-and-drop reordering between passages
// (builds a permutation array on drop and calls onReorder).
import { Eye, EyeOff, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { DRAG_TYPE_SECTION } from "@/constants/drag-types";
import { useInlineEdit } from "@/hooks/use-inline-edit";

interface SectionListProps {
  editorCount: number;
  sectionVisibility: boolean[];
  sectionNames: string[];
  addEditor: () => void;
  onUpdateName: (index: number, name: string) => void;
  onReorder: (permutation: number[]) => void;
  toggleSectionVisibility: (index: number) => void;
  toggleAllSectionVisibility: () => void;
}

export function SectionList({
  editorCount,
  sectionVisibility,
  sectionNames,
  addEditor,
  onUpdateName,
  onReorder,
  toggleSectionVisibility,
  toggleAllSectionVisibility,
}: SectionListProps) {
  const { t } = useTranslation("management");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  // Reset drag state when editorCount changes (e.g., passage deleted via trash
  // drop). The browser skips the dragend event when the source element is removed
  // from the DOM, so we can't rely on it for cleanup.
  useEffect(() => {
    setDragFromIndex(null);
    setDropTargetIndex(null);
  }, [editorCount]);

  const { isEditing, inputProps, startEditing } = useInlineEdit({
    currentName: editingIndex !== null ? sectionNames[editingIndex] : "",
    onCommit: (name) => {
      if (editingIndex !== null) {
        onUpdateName(editingIndex, name);
      }
      setEditingIndex(null);
    },
  });

  const handleStartEditing = (index: number) => {
    setEditingIndex(index);
    startEditing(sectionNames[index]);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-xs font-medium text-muted-foreground">
          {t("passages.title")}
        </h3>
        <div className="flex items-center gap-1">
          <button
            className="p-0.5 rounded hover:bg-accent text-muted-foreground shrink-0 cursor-pointer"
            onClick={addEditor}
            title={t("passages.addPassage")}
            data-testid="addPassageButton"
          >
            <Plus size={14} />
          </button>
          <button
            className="p-0.5 rounded hover:bg-accent text-muted-foreground shrink-0 cursor-pointer"
            onClick={toggleAllSectionVisibility}
            title={sectionVisibility.some(Boolean) ? t("passages.hideAll") : t("passages.showAll")}
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
            className={`flex items-center gap-2 px-1 py-0.5 rounded hover:bg-accent/50 cursor-grab${
              dragFromIndex === i ? " opacity-40" : ""
            }${dropTargetIndex === i && dragFromIndex !== i ? " border-t-2 border-primary" : ""}`}
            draggable={editorCount > 1}
            data-testid={`passageRow-${i}`}
            onDragStart={(e) => {
              e.dataTransfer.setData(DRAG_TYPE_SECTION, String(i));
              setDragFromIndex(i);
            }}
            onDragEnd={() => {
              setDragFromIndex(null);
              setDropTargetIndex(null);
            }}
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes(DRAG_TYPE_SECTION)) {
                e.preventDefault();
                setDropTargetIndex(i);
              }
            }}
            onDragLeave={() => {
              setDropTargetIndex(prev => prev === i ? null : prev);
            }}
            onDrop={(e) => {
              e.preventDefault();
              const fromStr = e.dataTransfer.getData(DRAG_TYPE_SECTION);
              if (fromStr === "") return;
              const from = Number(fromStr);
              setDragFromIndex(null);
              setDropTargetIndex(null);
              if (from === i) return;
              // Build permutation: move `from` to position `i`
              const indices = Array.from({ length: editorCount }, (_, k) => k);
              indices.splice(from, 1);
              indices.splice(i, 0, from);
              onReorder(indices);
            }}
          >
            {isEditing && editingIndex === i ? (
              <input
                {...inputProps}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    handleCancelEdit();
                    return;
                  }
                  inputProps.onKeyDown(e);
                }}
                className="text-sm w-full bg-transparent border-0 ring-1 ring-border rounded px-1 py-0 outline-none"
                data-testid={`passageNameInput-${i}`}
              />
            ) : (
              <div
                className="text-sm flex-1 bg-transparent border-0 rounded px-1 py-0 truncate cursor-text hover:bg-muted/50 hover:underline decoration-muted-foreground/30"
                onDoubleClick={() => handleStartEditing(i)}
                data-testid={`passageName-${i}`}
              >
                {sectionNames[i]}
              </div>
            )}
            <button
              className="p-0.5 rounded hover:bg-accent text-muted-foreground shrink-0 cursor-pointer"
              onClick={() => toggleSectionVisibility(i)}
              title={sectionVisibility[i] ? t("passages.hidePassage") : t("passages.showPassage")}
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
