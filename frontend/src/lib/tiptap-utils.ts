// Barrel re-export — all consumers importing from "@/lib/tiptap-utils" continue to work.
// Prefer importing from the specific module directly for new code.

export {
  MAC_SYMBOLS,
  SR_ONLY,
  isMac,
  formatShortcutKey,
  parseShortcutKeys,
} from "./tiptap/platform";
export { isMarkInSchema, isNodeInSchema, isExtensionAvailable } from "./tiptap/schema";
export {
  focusNextNode,
  isValidPosition,
  findNodeAtPosition,
  findNodePosition,
  updateNodesAttr,
} from "./tiptap/nodes";
export {
  isNodeTypeSelected,
  selectionWithinConvertibleTypes,
  selectCurrentBlockContent,
  getSelectedNodesOfType,
  getSelectedBlockNodes,
} from "./tiptap/selection";
export { MAX_FILE_SIZE, handleImageUpload } from "./tiptap/upload";
export { isAllowedUri, sanitizeUrl } from "./tiptap/url";
