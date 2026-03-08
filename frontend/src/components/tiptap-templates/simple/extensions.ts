// Configures all Tiptap extensions for each editor pane. Combines the
// StarterKit (paragraphs, headings, lists, etc.) with custom decoration
// plugins (layer highlights, underlines, word selection, arrows, hover)
// and standard extensions (image upload, typography, text alignment).
// When a Yjs fragment is provided, adds the Collaboration extension for
// real-time text sync via CRDT.
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import { Selection } from "@tiptap/extensions";
import { Markdown } from "@tiptap/markdown";
import Placeholder from "@tiptap/extension-placeholder";
import Collaboration from "@tiptap/extension-collaboration";
import type * as Y from "yjs";

import { LayerHighlightsExtension } from "@/lib/tiptap/extensions/layer-highlights";
import { LayerUnderlineExtension } from "@/lib/tiptap/extensions/layer-underlines";
import { WordSelectionExtension } from "@/lib/tiptap/extensions/word-selection";
import { SimilarTextHighlightsExtension } from "@/lib/tiptap/extensions/similar-text-highlights";
import { WordHoverExtension } from "@/lib/tiptap/extensions/word-hover";
import { ArrowLinesExtension } from "@/lib/tiptap/extensions/arrow-lines-plugin";
import { TextRemovalPreviewExtension } from "@/lib/tiptap/extensions/text-removal-preview";
import { PrintRefDecorationsExtension } from "@/lib/tiptap/extensions/print-ref-decorations";
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension";
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension";
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap/upload";

import defaultContent from "@/components/tiptap-templates/simple/data/content.json";

export interface EditorExtensionOptions {
  /** Yjs XmlFragment for collaborative editing. When provided, enables CRDT sync. */
  fragment?: Y.XmlFragment;
}

export function createSimpleEditorExtensions(opts?: EditorExtensionOptions) {
  const extensions = [
    StarterKit.configure({
      horizontalRule: false,
      link: {
        openOnClick: false,
        enableClickSelection: true,
      },
      // When using Yjs collaboration, disable the built-in history extension
      // since undo/redo is handled by Y.UndoManager
      ...(opts?.fragment ? { history: false } : {}),
    }),
    HorizontalRule,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Highlight.configure({ multicolor: true }),
    TextStyle,
    Color,
    Image,
    Typography,
    Superscript,
    Subscript,
    Selection,
    Table.configure({ resizable: true, allowTableNodeSelection: true }),
    TableRow,
    TableCell,
    TableHeader,
    LayerHighlightsExtension,
    LayerUnderlineExtension,
    WordSelectionExtension,
    SimilarTextHighlightsExtension,
    WordHoverExtension,
    ArrowLinesExtension,
    TextRemovalPreviewExtension,
    PrintRefDecorationsExtension,
    Markdown,
    Placeholder.configure({
      placeholder: "Paste or type your text here\u2026",
    }),
    ImageUploadNode.configure({
      accept: "image/*",
      maxSize: MAX_FILE_SIZE,
      limit: 3,
      upload: handleImageUpload,
      onError: (error) => console.error("Upload failed:", error),
    }),
  ];

  if (opts?.fragment) {
    extensions.push(
      Collaboration.configure({
        fragment: opts.fragment,
      }),
    );
  }

  return extensions;
}

export { defaultContent as SIMPLE_EDITOR_CONTENT };
