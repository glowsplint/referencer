// Configures all Tiptap extensions for each editor pane. Combines the
// StarterKit (paragraphs, headings, lists, etc.) with custom decoration
// plugins (layer highlights, underlines, word selection, arrows, hover)
// and standard extensions (image upload, typography, text alignment).
import { StarterKit } from "@tiptap/starter-kit"
import { Image } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Selection } from "@tiptap/extensions"

import { LayerHighlightsExtension } from "@/lib/tiptap/extensions/layer-highlights"
import { LayerUnderlineExtension } from "@/lib/tiptap/extensions/layer-underlines"
import { WordSelectionExtension } from "@/lib/tiptap/extensions/word-selection"
import { SimilarTextHighlightsExtension } from "@/lib/tiptap/extensions/similar-text-highlights"
import { WordHoverExtension } from "@/lib/tiptap/extensions/word-hover"
import { ArrowLinesExtension } from "@/lib/tiptap/extensions/arrow-lines-plugin"
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap/upload"

import defaultContent from "@/components/tiptap-templates/simple/data/content.json"

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
    LayerHighlightsExtension,
    LayerUnderlineExtension,
    WordSelectionExtension,
    SimilarTextHighlightsExtension,
    WordHoverExtension,
    ArrowLinesExtension,
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
