import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useRef, useState, useCallback, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  Link as LinkIcon,
  ImageIcon,
} from "lucide-react";

function ToolbarButton({
  isActive,
  onClick,
  children,
}: {
  isActive?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`p-0.5 rounded transition-colors ${isActive ? "bg-zinc-200 dark:bg-zinc-600" : "hover:bg-zinc-100 dark:hover:bg-zinc-700"}`}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

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
  const [focused, setFocused] = useState(false);
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
      setFocused(true);
    },
    onBlur: () => {
      blurTimeoutRef.current = setTimeout(() => {
        if (!containerRef.current?.contains(document.activeElement)) {
          setFocused(false);
          onBlur();
        }
      }, 150);
    },
  });

  useEffect(() => {
    return () => clearTimeout(blurTimeoutRef.current);
  }, []);

  const addLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        editor.chain().focus().setImage({ src }).run();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [editor]);

  if (!editor) return null;

  return (
    <div ref={containerRef} className="w-full">
      {focused && (
        <div className="flex items-center gap-0.5 px-2 pt-1 border-b border-zinc-100 dark:border-zinc-700 pb-1">
          <ToolbarButton
            isActive={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold size={12} />
          </ToolbarButton>
          <ToolbarButton
            isActive={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic size={12} />
          </ToolbarButton>
          <ToolbarButton
            isActive={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon size={12} />
          </ToolbarButton>
          <ToolbarButton
            isActive={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List size={12} />
          </ToolbarButton>
          <ToolbarButton isActive={editor.isActive("link")} onClick={addLink}>
            <LinkIcon size={12} />
          </ToolbarButton>
          <ToolbarButton onClick={addImage}>
            <ImageIcon size={12} />
          </ToolbarButton>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
