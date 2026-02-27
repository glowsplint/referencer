"use client";

import { useCallback, useEffect, useState } from "react";
import { type Editor } from "@tiptap/react";

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/ui/use-tiptap-editor";

// --- Lib ---
import { isMarkInSchema, isNodeTypeSelected } from "@/lib/tiptap-utils";

export const TEXT_COLORS = [
  { label: "Default", value: "" },
  { label: "Gray", value: "#6b7280" },
  { label: "Brown", value: "#92400e" },
  { label: "Orange", value: "#ea580c" },
  { label: "Yellow", value: "#ca8a04" },
  { label: "Green", value: "#16a34a" },
  { label: "Blue", value: "#2563eb" },
  { label: "Purple", value: "#9333ea" },
  { label: "Pink", value: "#db2777" },
  { label: "Red", value: "#dc2626" },
];

export type TextColor = (typeof TEXT_COLORS)[number];

export interface UseTextColorConfig {
  editor?: Editor | null;
  color?: string;
  hideWhenUnavailable?: boolean;
}

export function pickTextColorsByValue(values: string[]) {
  const colorMap = new Map(TEXT_COLORS.map((color) => [color.value, color]));
  return values
    .map((value) => colorMap.get(value))
    .filter((color): color is (typeof TEXT_COLORS)[number] => !!color);
}

export function canSetTextColor(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false;
  if (!isMarkInSchema("textStyle", editor) || isNodeTypeSelected(editor, ["image"])) return false;
  return editor.can().setMark("textStyle");
}

export function getActiveTextColor(editor: Editor | null): string {
  if (!editor) return "";
  return (editor.getAttributes("textStyle").color as string) || "";
}

export function isTextColorActive(editor: Editor | null, color?: string): boolean {
  if (!editor || !editor.isEditable) return false;
  if (!color) return !!getActiveTextColor(editor);
  return getActiveTextColor(editor) === color;
}

function shouldShowButton(props: { editor: Editor | null; hideWhenUnavailable: boolean }): boolean {
  const { editor, hideWhenUnavailable } = props;
  if (!editor || !editor.isEditable) return false;
  if (!isMarkInSchema("textStyle", editor)) return false;
  if (hideWhenUnavailable && !editor.isActive("code")) {
    return canSetTextColor(editor);
  }
  return true;
}

export function useTextColor(config: UseTextColorConfig) {
  const { editor: providedEditor, color, hideWhenUnavailable = false } = config;

  const { editor } = useTiptapEditor(providedEditor);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const canSet = canSetTextColor(editor);
  const isActive = isTextColorActive(editor, color);
  const currentColor = getActiveTextColor(editor);

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      setIsVisible(shouldShowButton({ editor, hideWhenUnavailable }));
    };

    handleUpdate();

    editor.on("selectionUpdate", handleUpdate);
    editor.on("transaction", handleUpdate);

    return () => {
      editor.off("selectionUpdate", handleUpdate);
      editor.off("transaction", handleUpdate);
    };
  }, [editor, hideWhenUnavailable]);

  const setTextColor = useCallback(
    (newColor: string) => {
      if (!editor || !canSet) return false;
      if (!newColor) {
        return editor.chain().focus().unsetColor().run();
      }
      return editor.chain().focus().setColor(newColor).run();
    },
    [editor, canSet],
  );

  const unsetTextColor = useCallback(() => {
    if (!editor || !canSet) return false;
    return editor.chain().focus().unsetColor().run();
  }, [editor, canSet]);

  return {
    isVisible,
    isActive,
    canSetTextColor: canSet,
    currentColor,
    setTextColor,
    unsetTextColor,
  };
}
