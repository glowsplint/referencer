// Rich text formatting toolbar (from tiptap template). Renders headings,
// lists, marks, text alignment, image upload, and link controls. Hidden
// when the editor is in locked (annotation) mode. Switches between a
// desktop layout and a mobile-friendly view with a link sub-screen.
"use client";

import { useEffect, useRef, useState } from "react";
import { useCurrentEditor } from "@tiptap/react";
import { useTranslation } from "react-i18next";
import { Lock, LockOpen } from "lucide-react";

import { Button } from "@/components/tiptap-ui-primitive/button";
import { Toolbar, ToolbarGroup, ToolbarSeparator } from "@/components/tiptap-ui-primitive/toolbar";

import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu";
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button";
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu";
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button";
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button";
import { LinkPopover, LinkContent, LinkButton } from "@/components/tiptap-ui/link-popover";
import { MarkButton } from "@/components/tiptap-ui/mark-button";
import { ClearFormattingButton } from "@/components/tiptap-ui/clear-formatting-button";
import { TextColorPopover } from "@/components/tiptap-ui/text-color-button";
import { TextRemovalButton } from "@/components/tiptap-ui/text-removal";
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button";
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button";
import { LineHeightDropdown } from "@/components/tiptap-ui/line-height-dropdown";
import { ParagraphSpacingDropdown } from "@/components/tiptap-ui/paragraph-spacing-dropdown";
import { TableDropdownMenu } from "@/components/tiptap-ui/table-dropdown-menu";

import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon";
import { LinkIcon } from "@/components/tiptap-icons/link-icon";

import { useIsBreakpoint } from "@/hooks/ui/use-is-breakpoint";
import { useWindowSize } from "@/hooks/utilities/use-window-size";
import { useCursorVisibility } from "@/hooks/ui/use-cursor-visibility";
import { useDocument } from "@/contexts/DocumentContext";

// --- Toolbar content (private) ---

const MainToolbarContent = ({
  onLinkClick,
  isMobile,
}: {
  onLinkClick: () => void;
  isMobile: boolean;
}) => {
  return (
    <>
      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal={isMobile} />
        <ListDropdownMenu types={["bulletList", "orderedList", "taskList"]} portal={isMobile} />
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
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
        <TextColorPopover />
        <ClearFormattingButton />
        <TextRemovalButton />
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
        <LineHeightDropdown portal={isMobile} />
        <ParagraphSpacingDropdown portal={isMobile} />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ImageUploadButton />
        <TableDropdownMenu portal={isMobile} />
      </ToolbarGroup>
    </>
  );
};

const MobileToolbarContent = ({ onBack }: { onBack: () => void }) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        <LinkIcon className="tiptap-button-icon" />
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    <LinkContent />
  </>
);

// --- Exported component ---

export function SimpleEditorToolbar({ isLocked = false }: { isLocked?: boolean }) {
  const isMobile = useIsBreakpoint();
  const { height } = useWindowSize();
  const [mobileView, setMobileView] = useState<"main" | "link">("main");
  const toolbarRef = useRef<HTMLDivElement>(null);
  const { editor: activeEditor } = useCurrentEditor();
  const { t: tm } = useTranslation("management");
  const { toggleFocusedPaneLocked, readOnly } = useDocument();

  const rect = useCursorVisibility({
    editor: activeEditor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  });

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main");
    }
  }, [isMobile, mobileView]);

  return (
    <Toolbar
      ref={toolbarRef}
      data-testid="editorToolbar"
      style={
        isMobile
          ? {
              bottom: `calc(100% - ${height - rect.y}px)`,
            }
          : undefined
      }
    >
      <div className={`flex items-center gap-1 min-w-0${isLocked ? " pointer-events-none" : ""}`}>
        {mobileView === "main" ? (
          <MainToolbarContent onLinkClick={() => setMobileView("link")} isMobile={isMobile} />
        ) : (
          <MobileToolbarContent onBack={() => setMobileView("main")} />
        )}
      </div>
      <ToolbarSeparator />
      <ToolbarGroup>
        <button
          onClick={toggleFocusedPaneLocked}
          disabled={readOnly}
          className={`p-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-40 disabled:pointer-events-none`}
          data-testid="lockButton"
          title={
            isLocked
              ? `${tm("tooltips.switchToEditMode")} (K)`
              : `${tm("tooltips.switchToAnnotateMode")} (K)`
          }
        >
          {isLocked ? <Lock size={16} /> : <LockOpen size={16} />}
        </button>
      </ToolbarGroup>
    </Toolbar>
  );
}
