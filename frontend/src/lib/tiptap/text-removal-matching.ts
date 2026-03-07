// Pure utility functions for the "Remove Text by Filter" feature.
// Handles glob/regex pattern compilation, document text matching,
// and batch deletion of matched ranges.
import type { Editor } from "@tiptap/core";
import type { Node } from "@tiptap/pm/model";

export interface MatchRange {
  from: number;
  to: number;
  text: string;
}

export interface TextRemovalFilter {
  selectedMarks: string[];
  pattern: string;
  isRegex: boolean;
}

/**
 * Convert a glob pattern to a regex string for substring matching.
 * - `*` becomes `.*?` (non-greedy, matching shortest substring)
 * - `?` becomes `.`
 * - All other special regex characters are escaped.
 */
export function globToRegex(glob: string): string {
  // First escape all special regex chars, then convert glob wildcards.
  // We use a two-pass approach: escape everything, then swap placeholders.
  let result = "";
  for (const ch of glob) {
    switch (ch) {
      case "*":
        result += ".*?";
        break;
      case "?":
        result += ".";
        break;
      case ".":
      case "+":
      case "^":
      case "$":
      case "{":
      case "}":
      case "(":
      case ")":
      case "|":
      case "[":
      case "]":
      case "\\":
        result += "\\" + ch;
        break;
      default:
        result += ch;
    }
  }
  return result;
}

/**
 * Compile a pattern string into a global RegExp.
 * In regex mode, the pattern is used directly.
 * In glob mode, it is converted via `globToRegex` first.
 * Returns `null` if the pattern is invalid.
 */
export function compilePattern(pattern: string, isRegex: boolean): RegExp | null {
  try {
    if (isRegex) {
      return new RegExp(pattern, "g");
    }
    const regexStr = pattern === "" ? ".*" : globToRegex(pattern);
    return new RegExp(regexStr, "g");
  } catch {
    return null;
  }
}

/**
 * Walk a ProseMirror document and find all text ranges that match the filter.
 *
 * Mark filtering uses AND logic: a text node must carry ALL marks listed
 * in `filter.selectedMarks`. An empty `selectedMarks` array matches all
 * text nodes regardless of their marks.
 *
 * Pattern matching is applied within each qualifying text node.
 */
export function findFilteredMatches(doc: Node, filter: TextRemovalFilter): MatchRange[] {
  const matches: MatchRange[] = [];

  doc.descendants((node, pos) => {
    if (!node.isText) return;

    // Check mark filter (AND logic)
    if (filter.selectedMarks.length > 0) {
      const nodeMarkNames = node.marks.map((m) => m.type.name);
      const hasAllMarks = filter.selectedMarks.every((mark) => nodeMarkNames.includes(mark));
      if (!hasAllMarks) return;
    }

    const text = node.text ?? "";

    // If glob mode with `*` pattern, return the entire text node as a match
    if (!filter.isRegex && filter.pattern === "*") {
      matches.push({ from: pos, to: pos + text.length, text });
      return;
    }

    const regex = compilePattern(filter.pattern, filter.isRegex);
    if (!regex) return;

    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      // Avoid infinite loops on zero-length matches
      if (match[0].length === 0) {
        regex.lastIndex++;
        continue;
      }
      matches.push({
        from: pos + match.index,
        to: pos + match.index + match[0].length,
        text: match[0],
      });
    }
  });

  return matches;
}

/**
 * Delete all matched ranges from the document in a single transaction.
 * Ranges are deleted in reverse document order to avoid position shifts.
 */
export function deleteMatchRanges(editor: Editor, matches: MatchRange[]): boolean {
  const sorted = [...matches].sort((a, b) => b.from - a.from);

  return editor
    .chain()
    .command(({ tr }) => {
      for (const match of sorted) {
        tr.delete(match.from, match.to);
      }
      return true;
    })
    .run();
}
