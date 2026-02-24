import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useRef, useEffect } from "react";

interface MiniCommentEditorProps {
  value: string;
  onChange: (html: string) => void;
  onBlur: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function MiniCommentEditor({
  value,
  onChange,
  onBlur,
  placeholder = "",
  autoFocus = false,
}: MiniCommentEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        horizontalRule: false,
        blockquote: false,
      }),
      Image,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-blue-500 underline" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    autofocus: autoFocus,
    editorProps: {
      attributes: {
        class: "prose-xs p-2 text-xs outline-none min-h-[1.5rem] dark:text-zinc-200",
      },
      handleKeyDown: (_view, event) => {
        event.stopPropagation();
        if (event.key === "Escape") {
          editor?.commands.blur();
          return true;
        }
        return false;
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of items) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (!file) return false;
            const reader = new FileReader();
            reader.onload = (e) => {
              const src = e.target?.result as string;
              editor?.chain().focus().setImage({ src }).run();
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
      handleDrop: (_view, event) => {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;
        for (const file of files) {
          if (file.type.startsWith("image/")) {
            event.preventDefault();
            const reader = new FileReader();
            reader.onload = (e) => {
              const src = e.target?.result as string;
              editor?.chain().focus().setImage({ src }).run();
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
    onFocus: () => {
      clearTimeout(blurTimeoutRef.current);
    },
    onBlur: () => {
      blurTimeoutRef.current = setTimeout(() => {
        if (!containerRef.current?.contains(document.activeElement)) {
          onBlur();
        }
      }, 150);
    },
  });

  useEffect(() => {
    return () => clearTimeout(blurTimeoutRef.current);
  }, []);

  if (!editor) return null;

  return (
    <div ref={containerRef} className="w-full">
      <EditorContent editor={editor} />
    </div>
  );
}
