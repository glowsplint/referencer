"use client";

import { useCallback, useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/ui/use-tiptap-editor";

// --- Lib ---
import { isNodeInSchema } from "@/lib/tiptap-utils";

export interface UseTableDropdownMenuConfig {
  editor?: Editor | null;
}

export function useTableDropdownMenu(config?: UseTableDropdownMenuConfig) {
  const { editor: providedEditor } = config || {};
  const { editor } = useTiptapEditor(providedEditor);
  const [isInTable, setIsInTable] = useState(false);

  const isVisible = isNodeInSchema("table", editor);

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      setIsInTable(editor.isActive("table"));
    };

    handleUpdate();

    editor.on("selectionUpdate", handleUpdate);
    editor.on("transaction", handleUpdate);

    return () => {
      editor.off("selectionUpdate", handleUpdate);
      editor.off("transaction", handleUpdate);
    };
  }, [editor]);

  const insertTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const addRowBefore = useCallback(() => {
    editor?.chain().focus().addRowBefore().run();
  }, [editor]);

  const addRowAfter = useCallback(() => {
    editor?.chain().focus().addRowAfter().run();
  }, [editor]);

  const deleteRow = useCallback(() => {
    editor?.chain().focus().deleteRow().run();
  }, [editor]);

  const addColumnBefore = useCallback(() => {
    editor?.chain().focus().addColumnBefore().run();
  }, [editor]);

  const addColumnAfter = useCallback(() => {
    editor?.chain().focus().addColumnAfter().run();
  }, [editor]);

  const deleteColumn = useCallback(() => {
    editor?.chain().focus().deleteColumn().run();
  }, [editor]);

  const mergeCells = useCallback(() => {
    editor?.chain().focus().mergeCells().run();
  }, [editor]);

  const splitCell = useCallback(() => {
    editor?.chain().focus().splitCell().run();
  }, [editor]);

  const toggleHeaderRow = useCallback(() => {
    editor?.chain().focus().toggleHeaderRow().run();
  }, [editor]);

  const toggleHeaderColumn = useCallback(() => {
    editor?.chain().focus().toggleHeaderColumn().run();
  }, [editor]);

  const deleteTable = useCallback(() => {
    editor?.chain().focus().deleteTable().run();
  }, [editor]);

  return {
    isVisible,
    isInTable,
    insertTable,
    addRowBefore,
    addRowAfter,
    deleteRow,
    addColumnBefore,
    addColumnAfter,
    deleteColumn,
    mergeCells,
    splitCell,
    toggleHeaderRow,
    toggleHeaderColumn,
    deleteTable,
  };
}
