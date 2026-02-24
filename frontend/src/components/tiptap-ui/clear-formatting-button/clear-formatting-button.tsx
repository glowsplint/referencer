"use client";

import { useCallback } from "react";

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/ui/use-tiptap-editor";

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button";

// --- Icons ---
import { RemoveFormatting } from "lucide-react";

export function ClearFormattingButton() {
  const { editor } = useTiptapEditor();

  const handleClick = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().unsetAllMarks().clearNodes().run();
  }, [editor]);

  if (!editor) return null;

  return (
    <Button
      type="button"
      data-style="ghost"
      role="button"
      tabIndex={-1}
      aria-label="Clear formatting"
      tooltip="Clear formatting"
      onClick={handleClick}
    >
      <RemoveFormatting className="tiptap-button-icon" />
    </Button>
  );
}
