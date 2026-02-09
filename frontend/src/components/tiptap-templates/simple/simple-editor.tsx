"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { EditorContent, useCurrentEditor, useEditor } from "@tiptap/react"
import type { Editor } from "@tiptap/react"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { Image } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Selection } from "@tiptap/extensions"

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button"
import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar"

// --- Tiptap Node ---
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button"
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover"
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap-ui/link-popover"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"

// --- Tooltip ---
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/tiptap-ui-primitive/tooltip"

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon"
import { LinkIcon } from "@/components/tiptap-icons/link-icon"

// --- Hooks ---
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint"
import { useWindowSize } from "@/hooks/use-window-size"
import { useCursorVisibility } from "@/hooks/use-cursor-visibility"

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils"

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss"

import defaultContent from "@/components/tiptap-templates/simple/data/content.json"

// --- Shared extensions factory ---

export function createSimpleEditorExtensions() {
  return [
    StarterKit.configure({
      horizontalRule: false,
      link: {
        openOnClick: false,
        enableClickSelection: true,
      },
    }),
    HorizontalRule,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Highlight.configure({ multicolor: true }),
    Image,
    Typography,
    Superscript,
    Subscript,
    Selection,
    ImageUploadNode.configure({
      accept: "image/*",
      maxSize: MAX_FILE_SIZE,
      limit: 3,
      upload: handleImageUpload,
      onError: (error) => console.error("Upload failed:", error),
    }),
  ]
}

export { defaultContent as SIMPLE_EDITOR_CONTENT }

// --- Toolbar content (private) ---

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
}: {
  onHighlighterClick: () => void
  onLinkClick: () => void
  isMobile: boolean
}) => {
  return (
    <>
      <Spacer />

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal={isMobile} />
        <ListDropdownMenu
          types={["bulletList", "orderedList", "taskList"]}
          portal={isMobile}
        />
        <BlockquoteButton />
        <CodeBlockButton />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ImageUploadButton text="Add" />
      </ToolbarGroup>

      <Spacer />

    </>
  )
}

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link"
  onBack: () => void
}) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
)

// --- Exported components ---

export function TitleBar() {
  const [title, setTitle] = useState("Title")
  const [isEditing, setIsEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const startEditing = useCallback(() => {
    setIsEditing(true)
  }, [])

  const stopEditing = useCallback(() => {
    setIsEditing(false)
    if (title.trim() === "") {
      setTitle("Title")
    }
  }, [title])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === "Escape") {
        e.preventDefault()
        inputRef.current?.blur()
      }
    },
    []
  )

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  return (
    <div className="flex items-center px-4 py-2 border-b border-[var(--tt-border-color-tint)] bg-[var(--tt-bg-color)] shrink-0">
      {isEditing ? (
        <input
          ref={inputRef}
          className="text-sm font-medium font-[inherit] text-[var(--tt-theme-text)] px-2 py-1 rounded-md border border-[var(--tt-brand-color-400)] outline-none bg-transparent min-w-[100px]"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={stopEditing}
          onKeyDown={handleKeyDown}
          spellCheck={false}
        />
      ) : (
        <Tooltip placement="bottom" delay={300}>
          <TooltipTrigger asChild>
            <div
              className="text-sm font-medium text-[var(--tt-theme-text)] px-2 py-1 rounded-md border border-transparent cursor-text select-none transition-[border-color] duration-150 hover:border-[var(--tt-border-color)]"
              onClick={startEditing}
            >
              {title}
            </div>
          </TooltipTrigger>
          <TooltipContent>Rename</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

export function SimpleEditorToolbar({ isLocked = false }: { isLocked?: boolean }) {
  const isMobile = useIsBreakpoint()
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">("main")
  const toolbarRef = useRef<HTMLDivElement>(null)
  const { editor: activeEditor } = useCurrentEditor()

  const rect = useCursorVisibility({
    editor: activeEditor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main")
    }
  }, [isMobile, mobileView])

  return (
    <Toolbar
      ref={toolbarRef}
      style={{
        ...(isMobile
          ? {
              bottom: `calc(100% - ${height - rect.y}px)`,
            }
          : {}),
        opacity: isLocked ? 0 : 1,
        maxHeight: isLocked ? 0 : "var(--tt-toolbar-height)",
        overflow: "hidden",
        transition: "opacity 0.1s ease, max-height 0.1s ease",
        pointerEvents: isLocked ? "none" : "auto",
      }}
    >
      {mobileView === "main" ? (
        <MainToolbarContent
          onHighlighterClick={() => setMobileView("highlighter")}
          onLinkClick={() => setMobileView("link")}
          isMobile={isMobile}
        />
      ) : (
        <MobileToolbarContent
          type={mobileView === "highlighter" ? "highlighter" : "link"}
          onBack={() => setMobileView("main")}
        />
      )}
    </Toolbar>
  )
}

export function EditorPane({
  isLocked,
  content,
  index,
  onEditorMount,
  onFocus,
}: {
  isLocked: boolean
  content?: Record<string, unknown>
  index: number
  onEditorMount: (index: number, editor: Editor) => void
  onFocus: (index: number) => void
}) {
  const [extensions] = useState(() => createSimpleEditorExtensions())

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Content area, start typing to enter text.",
        class: "simple-editor",
      },
    },
    extensions,
    content,
  })

  useEffect(() => {
    if (editor) {
      onEditorMount(index, editor)
    }
  }, [editor, index, onEditorMount])

  useLayoutEffect(() => {
    if (editor) {
      editor.setEditable(!isLocked)
      if (!isLocked) {
        editor.emit("selectionUpdate", { editor, transaction: editor.state.tr })
      }
    }
  }, [editor, isLocked])

  const handleFocus = useCallback(() => {
    onFocus(index)
  }, [index, onFocus])

  return (
    <div className="simple-editor-wrapper" onFocusCapture={handleFocus}>
      <EditorContent
        editor={editor}
        role="presentation"
        className="simple-editor-content"
      />
    </div>
  )
}
