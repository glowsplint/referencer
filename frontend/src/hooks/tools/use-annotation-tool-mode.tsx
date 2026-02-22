// Generic factory hook for annotation tool modes (highlight, underline, comment).
// Extracts the shared pattern: ref initialization, entry/exit toasts,
// layer auto-creation, toggle-by-selection, and confirm callback.
import { useEffect, useRef, useCallback } from "react";
import { Trans } from "react-i18next";
import { ToastKbd } from "@/components/ui/ToastKbd";
import type { ActiveTool, WordSelection } from "@/types/editor";
import { FLASH_DURATION_MS, type StatusMessage } from "@/hooks/ui/use-status-message";
import { useLatestRef } from "@/hooks/utilities/use-latest-ref";

export interface AnnotationToolConfig<TLayer> {
  /** ActiveTool value that activates this mode (e.g. "highlight", "underline", "comments") */
  toolName: ActiveTool;
  /** i18n namespace key prefix (e.g. "highlight", "underline", "comments") */
  i18nKey: string;
  /** Extract the relevant items array from a layer for toggle matching */
  getItems: (layer: TLayer) => readonly AnnotationItem[];
  /** Find an existing item to toggle off. Return undefined to skip toggle. */
  findExisting: (
    items: readonly AnnotationItem[],
    sel: WordSelection,
  ) => AnnotationItem | undefined;
  /** Build the payload to pass to the add function. */
  buildPayload: (sel: WordSelection) => unknown;
  /** Optional pre-confirm cleanup (e.g. comment removes empty-annotation items). */
  preConfirm?: (layerId: string, layer: TLayer) => void;
}

export interface AnnotationItem {
  id: string;
  editorIndex: number;
  from: number;
  to: number;
  text: string;
}

export interface UseAnnotationToolModeOptions<TLayer> {
  config: AnnotationToolConfig<TLayer>;
  isLocked: boolean;
  activeTool: ActiveTool;
  selection: WordSelection | null;
  activeLayerId: string | null;
  addLayer: () => string;
  layers: TLayer[];
  addItem: (layerId: string, payload: never) => string;
  removeItem: (layerId: string, itemId: string) => void;
  showToasts: boolean;
  setStatus: (msg: StatusMessage) => void;
  flashStatus: (msg: StatusMessage, duration: number) => void;
  clearStatus: () => void;
  /** i18n-resolved string for "added" toast */
  addedText?: string;
  /** i18n-resolved string for "removed" toast */
  removedText?: string;
  /** Called after a new item is created */
  onItemAdded?: (layerId: string, itemId: string) => void;
}

/** Layers must have at least an id so we can find them */
interface LayerWithId {
  id: string;
}

export function useAnnotationToolMode<TLayer extends LayerWithId>({
  config,
  isLocked,
  activeTool,
  selection,
  activeLayerId,
  addLayer,
  layers,
  addItem,
  removeItem,
  showToasts,
  setStatus,
  flashStatus,
  clearStatus,
  addedText,
  removedText,
  onItemAdded,
}: UseAnnotationToolModeOptions<TLayer>) {
  // activeLayerIdRef uses useEffect sync (not useLatestRef) because confirm
  // writes to it locally after auto-creating a layer — the local value must persist
  // until the parent passes down a new activeLayerId prop
  const activeLayerIdRef = useRef(activeLayerId);
  useEffect(() => {
    activeLayerIdRef.current = activeLayerId;
  }, [activeLayerId]);

  const addLayerRef = useLatestRef(addLayer);
  const addItemRef = useLatestRef(addItem);
  const removeItemRef = useLatestRef(removeItem);
  const layersRef = useLatestRef(layers);
  const selectionRef = useLatestRef(selection);
  const activeToolRef = useLatestRef(activeTool);
  const isLockedRef = useLatestRef(isLocked);
  const showToastsRef = useLatestRef(showToasts);
  const setStatusRef = useLatestRef(setStatus);
  const flashStatusRef = useLatestRef(flashStatus);
  const clearStatusRef = useLatestRef(clearStatus);
  const configRef = useLatestRef(config);
  const addedTextRef = useLatestRef(addedText);
  const removedTextRef = useLatestRef(removedText);
  const onItemAddedRef = useLatestRef(onItemAdded);

  const isActive = activeTool === config.toolName && isLocked;

  // Entry/exit effect
  useEffect(() => {
    if (isActive) {
      if (showToastsRef.current) {
        setStatusRef.current({
          text: (
            <Trans
              ns="tools"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              i18nKey={`${configRef.current.i18nKey}.selectWords` as any}
              components={{ kbd: <ToastKbd>_</ToastKbd> }}
            />
          ),
          type: "info",
        });
      }
    } else if (activeToolRef.current === "selection" || !isLockedRef.current) {
      clearStatusRef.current();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const confirm = useCallback(() => {
    const cfg = configRef.current;
    if (activeToolRef.current !== cfg.toolName || !isLockedRef.current) return;

    const sel = selectionRef.current;
    if (!sel) return;

    let layerId = activeLayerIdRef.current;
    if (!layerId) {
      const id = addLayerRef.current();
      if (!id) return;
      layerId = id;
      activeLayerIdRef.current = id;
    }

    const layer = layersRef.current.find((l) => l.id === layerId);

    // Optional pre-confirm cleanup
    if (layer && cfg.preConfirm) {
      cfg.preConfirm(layerId!, layer);
    }

    // Check for toggle: same word = remove existing item
    if (layer) {
      const items = cfg.getItems(layer);
      const existing = cfg.findExisting(items, sel);
      if (existing) {
        removeItemRef.current(layerId!, existing.id);
        if (showToastsRef.current && removedTextRef.current) {
          flashStatusRef.current(
            { text: removedTextRef.current, type: "success" },
            FLASH_DURATION_MS,
          );
        }
        return;
      }
    }

    // Create new item
    const payload = cfg.buildPayload(sel);
    const itemId = (addItemRef.current as (layerId: string, payload: unknown) => string)(
      layerId!,
      payload,
    );
    if (showToastsRef.current && addedTextRef.current) {
      flashStatusRef.current({ text: addedTextRef.current, type: "success" }, FLASH_DURATION_MS);
    }
    onItemAddedRef.current?.(layerId!, itemId);
  }, []);

  return { confirm };
}
