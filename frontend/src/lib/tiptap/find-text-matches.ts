// Finds all exact, case-sensitive occurrences of a search string within
// a ProseMirror document. Returns document-absolute positions suitable
// for creating decorations (e.g. similar-text highlights).
import type { Node as PMNode } from "@tiptap/pm/model";

export interface TextMatch {
  from: number;
  to: number;
}

/**
 * Find all exact, case-sensitive matches of `searchText` within textblocks of a ProseMirror document.
 * Multi-word phrases that span across block boundaries won't match.
 */
export function findTextMatches(doc: PMNode, searchText: string): TextMatch[] {
  if (!searchText) return [];

  const matches: TextMatch[] = [];

  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true;

    const text = node.textContent;
    let startIndex = 0;

    while (startIndex <= text.length - searchText.length) {
      const foundIndex = text.indexOf(searchText, startIndex);
      if (foundIndex === -1) break;

      // pos + 1 skips the textblock node's opening token in ProseMirror offsets
      const from = pos + 1 + foundIndex;
      matches.push({ from, to: from + searchText.length });

      // Advance past this match (non-overlapping)
      startIndex = foundIndex + searchText.length;
    }

    return false;
  });

  return matches;
}
