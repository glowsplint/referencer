// Manages the multi-pane editor layout: add/remove texts (up to 4),
// track split positions, section visibility/names, and active editor focus.
// Handles divider resize with minimum pane width constraints.
// When a documentId is provided, layout state is persisted to localStorage.
import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import { STORAGE_KEYS } from "@/constants/storage-keys";

// Minimum pane width (%) — prevents panes from collapsing entirely during resize
const MIN_EDITOR_PCT = 10;

function computeEvenSplitPositions(count: number): number[] {
  return Array.from({ length: count - 1 }, (_, i) => ((i + 1) / count) * 100);
}

const DEFAULT_EDITOR_COUNT = 1;

interface PersistedLayout {
  editorCount: number;
  sectionNames: string[];
  sectionVisibility: boolean[];
}

function loadPersistedLayout(documentId: string): PersistedLayout | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.EDITOR_LAYOUT_PREFIX}${documentId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedLayout>;
    if (
      typeof parsed.editorCount !== "number" ||
      !Array.isArray(parsed.sectionNames) ||
      !Array.isArray(parsed.sectionVisibility)
    ) {
      return null;
    }
    // Sanity: clamp to valid range
    const count = Math.max(1, Math.min(4, parsed.editorCount));
    return {
      editorCount: count,
      sectionNames: parsed.sectionNames.slice(0, count),
      sectionVisibility: parsed.sectionVisibility.slice(0, count),
    };
  } catch {
    return null;
  }
}

/** Derive the next text counter from existing section names (find max "Text N" number). */
function deriveTextCounter(names: string[]): number {
  let max = 0;
  for (const name of names) {
    const match = /^Text (\d+)$/.exec(name);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return max;
}

export function useEditors(documentId?: string) {
  const persisted = documentId ? loadPersistedLayout(documentId) : null;
  const initialCount = persisted?.editorCount ?? DEFAULT_EDITOR_COUNT;

  const [editorCount, setEditorCount] = useState(initialCount);
  const [splitPositions, setSplitPositions] = useState<number[]>(() =>
    computeEvenSplitPositions(initialCount),
  );
  const [sectionVisibility, setSectionVisibility] = useState<boolean[]>(
    () => persisted?.sectionVisibility ?? Array.from({ length: initialCount }, () => true),
  );
  const [sectionNames, setSectionNames] = useState<string[]>(
    () =>
      persisted?.sectionNames ?? Array.from({ length: initialCount }, (_, i) => `Text ${i + 1}`),
  );
  const [editorKeys, setEditorKeys] = useState<number[]>(() =>
    Array.from({ length: initialCount }, (_, i) => i),
  );
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);
  const [activeEditorIndex, setActiveEditorIndex] = useState(0);
  const [mountedEditorCount, setMountedEditorCount] = useState(0);
  const editorsRef = useRef<Map<number, Editor>>(new Map());
  const textCounterRef = useRef(
    persisted ? deriveTextCounter(persisted.sectionNames) : DEFAULT_EDITOR_COUNT,
  );
  const editorCountRef = useRef(initialCount);
  const editorKeyCounterRef = useRef(initialCount);

  const [columnSplit, setColumnSplit] = useState(50);
  const [rowSplit, setRowSplit] = useState(50);

  // Persist layout to localStorage when it changes
  const documentIdRef = useRef(documentId);
  documentIdRef.current = documentId;
  useEffect(() => {
    if (!documentIdRef.current) return;
    try {
      const layout: PersistedLayout = { editorCount, sectionNames, sectionVisibility };
      localStorage.setItem(
        `${STORAGE_KEYS.EDITOR_LAYOUT_PREFIX}${documentIdRef.current}`,
        JSON.stringify(layout),
      );
    } catch {
      /* quota exceeded or unavailable */
    }
  }, [editorCount, sectionNames, sectionVisibility]);

  const handleColumnResize = useCallback((pct: number) => {
    setColumnSplit(Math.min(100 - MIN_EDITOR_PCT, Math.max(MIN_EDITOR_PCT, pct)));
  }, []);

  const handleRowResize = useCallback((pct: number) => {
    setRowSplit(Math.min(100 - MIN_EDITOR_PCT, Math.max(MIN_EDITOR_PCT, pct)));
  }, []);

  const addEditor = useCallback((opts?: { name?: string }): string => {
    if (editorCountRef.current >= 4) {
      return opts?.name ?? `Text ${textCounterRef.current}`;
    }
    if (!opts?.name) {
      textCounterRef.current += 1;
    }
    const name = opts?.name ?? `Text ${textCounterRef.current}`;
    const newCount = editorCountRef.current + 1;
    editorCountRef.current = newCount;
    setEditorCount(newCount);
    setSplitPositions(computeEvenSplitPositions(newCount));
    setSectionVisibility((prev) => [...prev, true]);
    setSectionNames((prev) => [...prev, name]);
    const key = editorKeyCounterRef.current++;
    setEditorKeys((prev) => [...prev, key]);
    return name;
  }, []);

  const removeEditor = useCallback((index: number) => {
    if (editorCountRef.current <= 1) return;
    const oldCount = editorCountRef.current;
    const newCount = oldCount - 1;
    editorCountRef.current = newCount;
    editorsRef.current.delete(index);
    // Re-key remaining editors
    const newMap = new Map<number, Editor>();
    let newIndex = 0;
    for (let i = 0; i < oldCount; i++) {
      if (i === index) continue;
      const editor = editorsRef.current.get(i);
      if (editor) newMap.set(newIndex, editor);
      newIndex++;
    }
    editorsRef.current = newMap;
    setEditorCount(newCount);
    setSplitPositions(computeEvenSplitPositions(newCount));
    setSectionVisibility((prev) => prev.filter((_, i) => i !== index));
    setSectionNames((prev) => prev.filter((_, i) => i !== index));
    setEditorKeys((prev) => prev.filter((_, i) => i !== index));
    // Set active editor to the first remaining editor
    const firstEditor = newMap.get(0);
    if (firstEditor) setActiveEditor(firstEditor);
    setActiveEditorIndex(0);
  }, []);

  const updateSectionName = useCallback((index: number, name: string) => {
    setSectionNames((prev) => prev.map((n, i) => (i === index ? name : n)));
  }, []);

  const toggleSectionVisibility = useCallback((index: number) => {
    setSectionVisibility((prev) => prev.map((v, i) => (i === index ? !v : v)));
  }, []);

  const toggleAllSectionVisibility = useCallback(() => {
    setSectionVisibility((prev) => {
      const anyVisible = prev.some((v) => v);
      return prev.map(() => !anyVisible);
    });
  }, []);

  const handleDividerResize = useCallback((index: number, pct: number) => {
    setSplitPositions((positions) => {
      const newPositions = [...positions];
      const lower = index > 0 ? positions[index - 1] + MIN_EDITOR_PCT : MIN_EDITOR_PCT;
      const upper =
        index < positions.length - 1 ? positions[index + 1] - MIN_EDITOR_PCT : 100 - MIN_EDITOR_PCT;
      newPositions[index] = Math.min(upper, Math.max(lower, pct));
      return newPositions;
    });
  }, []);

  const handleEditorMount = useCallback((index: number, editor: Editor) => {
    editorsRef.current.set(index, editor);
    setMountedEditorCount((prev) => prev + 1);
    if (index === 0) {
      setActiveEditor(editor);
    }
  }, []);

  const reorderEditors = useCallback((permutation: number[]) => {
    setSectionNames((prev) => permutation.map((old) => prev[old]));
    setSectionVisibility((prev) => permutation.map((old) => prev[old]));
    setEditorKeys((prev) => permutation.map((old) => prev[old]));
    // Reset to even splits — preserving custom positions across arbitrary permutations is not worth the complexity
    setSplitPositions(computeEvenSplitPositions(permutation.length));
    // Re-key editorsRef according to permutation
    const oldMap = editorsRef.current;
    const newMap = new Map<number, Editor>();
    for (let newIdx = 0; newIdx < permutation.length; newIdx++) {
      const oldIdx = permutation[newIdx];
      const editor = oldMap.get(oldIdx);
      if (editor) newMap.set(newIdx, editor);
    }
    editorsRef.current = newMap;
  }, []);

  const handlePaneFocus = useCallback((index: number) => {
    const editor = editorsRef.current.get(index);
    if (editor) {
      setActiveEditor(editor);
    }
    setActiveEditorIndex(index);
  }, []);

  const editorWidths = useMemo(() => {
    const widths: number[] = [];
    for (let i = 0; i < editorCount; i++) {
      const start = i === 0 ? 0 : splitPositions[i - 1];
      const end = i === editorCount - 1 ? 100 : splitPositions[i];
      widths.push(end - start);
    }
    return widths;
  }, [editorCount, splitPositions]);

  return {
    editorCount,
    mountedEditorCount,
    activeEditor,
    activeEditorIndex,
    editorWidths,
    columnSplit,
    rowSplit,
    handleColumnResize,
    handleRowResize,
    sectionVisibility,
    sectionNames,
    editorKeys,
    editorsRef,
    addEditor,
    removeEditor,
    updateSectionName,
    toggleSectionVisibility,
    toggleAllSectionVisibility,
    handleDividerResize,
    reorderEditors,
    handleEditorMount,
    handlePaneFocus,
    setEditorCount: (count: number) => {
      editorCountRef.current = count;
      setEditorCount(count);
    },
    setSectionNames,
    setSectionVisibility,
    setSplitPositions,
    setEditorKeys,
  };
}
