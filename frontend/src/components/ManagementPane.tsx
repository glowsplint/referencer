// Left sidebar that organizes document structure: annotation layers and texts.
// Provides controls to add/remove/reorder layers and texts, toggle visibility,
// and a drag-to-trash delete zone. Consumes DocumentContext for all state
// mutations.
import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, Eye, EyeOff, Plus, Search, Trash2, X } from "lucide-react";
import { LayerRow } from "./LayerRow";
import { SectionList } from "./SectionList";
import { StudySchemePicker } from "./StudySchemePicker";

import { DRAG_TYPE_LAYER, DRAG_TYPE_SECTION } from "@/constants/drag-types";
import { useDocument } from "@/contexts/DocumentContext";
import { useCustomColors } from "@/hooks/ui/use-custom-colors";
import { useAnnotationSearch } from "@/hooks/ui/use-annotation-search";
import { AnnotationSearchResults } from "./AnnotationSearchResults";
import { scrollToKeepInView } from "@/hooks/selection/use-selection-decoration";
import type { AnnotationSearchMatch } from "@/types/editor";

interface ManagementPaneProps {
  width?: number;
}

export function ManagementPane({ width }: ManagementPaneProps) {
  const { t } = useTranslation("management");

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
    removeUnderline,
    toggleHighlightVisibility,
    toggleArrowVisibility,
    toggleUnderlineVisibility,
    addEditor,
    removeEditor,
    reorderEditors,
    updateSectionName,
    toggleSectionVisibility,
    toggleAllSectionVisibility,
    editorsRef,
  } = useDocument();

  const { customColors, addCustomColor, removeCustomColor } = useCustomColors();
  const [dragOver, setDragOver] = useState(false);
  const [schemePickerOpen, setSchemePickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResults = useAnnotationSearch(layers, searchQuery);

  const hasVisibleLayers = layers.some((l) => l.visible);

  const handleResultClick = useCallback(
    (match: AnnotationSearchMatch) => {
      try {
        const editor = editorsRef.current.get(match.editorIndex);
        if (!editor) return;
        const startPos = editor.view.domAtPos(match.from);
        const endPos = editor.view.domAtPos(match.to);
        const range = document.createRange();
        range.setStart(startPos.node, startPos.offset);
        range.setEnd(endPos.node, endPos.offset);
        const rect = range.getBoundingClientRect();
        const wrapper = editor.view.dom.closest(".simple-editor-wrapper") as HTMLElement | null;
        if (!wrapper) return;
        const wrapperRect = wrapper.getBoundingClientRect();
        scrollToKeepInView(
          wrapper,
          rect.top - wrapperRect.top + wrapper.scrollTop,
          rect.left - wrapperRect.left + wrapper.scrollLeft,
          rect.height,
          rect.width,
        );
      } catch {
        // positions may be stale
      }
    },
    [editorsRef],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "KeyF" || !(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      searchInputRef.current?.focus();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

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
      className="shrink-0 h-full overflow-y-auto p-3"
      style={{ width: width ?? 250 }}
      data-testid="managementPane"
    >
      <div className="relative mb-3">
        <Search
          size={14}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("search.placeholder")}
          className="w-full pl-7 pr-7 py-1.5 text-xs rounded border bg-background"
          data-testid="annotationSearchInput"
        />
        {searchQuery && (
          <button
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-accent text-muted-foreground cursor-pointer"
            onClick={() => setSearchQuery("")}
            data-testid="clearSearchButton"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {searchQuery.trim().length >= 2 ? (
        <AnnotationSearchResults
          matches={searchResults}
          query={searchQuery}
          onResultClick={handleResultClick}
        />
      ) : (
        <>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-xs font-medium text-muted-foreground">{t("layers.title")}</h3>
              <div className="flex items-center gap-1">
                <StudySchemePicker
                  open={schemePickerOpen}
                  onOpenChange={setSchemePickerOpen}
                  onBlankLayer={() => addLayer({ extraColors: customColors })}
                >
                  <button
                    className="p-0.5 rounded hover:bg-accent text-muted-foreground shrink-0 cursor-pointer"
                    onClick={() => {
                      if (layers.length === 0) {
                        setSchemePickerOpen(true);
                      } else {
                        addLayer({ extraColors: customColors });
                      }
                    }}
                    title={t("layers.addLayer")}
                    data-testid="addLayerButton"
                  >
                    <Plus size={14} />
                  </button>
                </StudySchemePicker>
                <button
                  className="p-0.5 rounded hover:bg-accent text-muted-foreground shrink-0 cursor-pointer"
                  onClick={() => setSchemePickerOpen(true)}
                  title={t("schemes.applyScheme")}
                  data-testid="applySchemeButton"
                >
                  <BookOpen size={14} />
                </button>
                <button
                  className="p-0.5 rounded hover:bg-accent text-muted-foreground shrink-0 cursor-pointer"
                  onClick={toggleAllLayerVisibility}
                  title={hasVisibleLayers ? t("layers.hideAll") : t("layers.showAll")}
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
                  onRemoveUnderline={removeUnderline}
                  onToggleHighlightVisibility={toggleHighlightVisibility}
                  onToggleArrowVisibility={toggleArrowVisibility}
                  onToggleUnderlineVisibility={toggleUnderlineVisibility}
                  customColors={customColors}
                  onAddCustomColor={addCustomColor}
                  onRemoveCustomColor={removeCustomColor}
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
        </>
      )}

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
