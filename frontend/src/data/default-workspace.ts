// Default workspace data for the Bible study demo.
// Provides two passage contents (1 Cor 1:18-31, 1 Cor 2:6-16),
// four pre-populated annotation layers, and a placeholder for new editors.
import content1Cor1 from "./default-content-1cor1.json"
import content1Cor2 from "./default-content-1cor2.json"
import placeholderContent from "./placeholder-content.json"
import type { Layer, Highlight, Arrow, LayerUnderline, ArrowStyle } from "@/types/editor"

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const DEFAULT_PASSAGE_CONTENTS: Record<string, unknown>[] = [
  content1Cor1 as Record<string, unknown>,
  content1Cor2 as Record<string, unknown>,
]

export const DEFAULT_SECTION_NAMES = [
  "1 Corinthians 1:18\u201331",
  "1 Corinthians 2:6\u201316",
]

export const PLACEHOLDER_CONTENT = placeholderContent as Record<string, unknown>

export function createDefaultLayers(): Layer[] {
  const doc0 = content1Cor1
  const doc1 = content1Cor2
  return [
    keyTheologicalTermsLayer(doc0, doc1),
    contrastsAndParallelsLayer(doc0, doc1),
    structuralMarkersLayer(doc0, doc1),
    calvinistThemesLayer(doc0, doc1),
  ]
}

// ---------------------------------------------------------------------------
// ProseMirror position calculator
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNodeText(node: any): string {
  if (node.type === "text") return node.text || ""
  if (!node.content) return ""
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return node.content.map((n: any) => getNodeText(n)).join("")
}

interface Pos {
  from: number
  to: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findInDoc(doc: any, search: string, occurrence = 0): Pos {
  let pos = 0
  let found = 0

  for (const node of doc.content) {
    pos += 1 // entering block node
    const text = getNodeText(node)
    let searchFrom = 0
    let idx: number
    while ((idx = text.indexOf(search, searchFrom)) !== -1) {
      if (found === occurrence) {
        return { from: pos + idx, to: pos + idx + search.length }
      }
      found++
      searchFrom = idx + 1
    }
    pos += text.length
    pos += 1 // leaving block node
  }

  throw new Error(
    `Text not found in doc: "${search}" (occurrence ${occurrence})`
  )
}

// ---------------------------------------------------------------------------
// Annotation helpers
// ---------------------------------------------------------------------------

let idCounter = 0
function nextId(): string {
  return `default-${++idCounter}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hl(editorIndex: number, doc: any, text: string, occurrence = 0): Highlight {
  const pos = findInDoc(doc, text, occurrence)
  return {
    id: nextId(),
    editorIndex,
    from: pos.from,
    to: pos.to,
    text,
    annotation: "",
    type: "highlight",
  }
}

function comment(
  editorIndex: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any,
  text: string,
  annotation: string,
  occurrence = 0
): Highlight {
  const pos = findInDoc(doc, text, occurrence)
  return {
    id: nextId(),
    editorIndex,
    from: pos.from,
    to: pos.to,
    text,
    annotation,
    type: "comment",
  }
}

function arrow(
  fromEditor: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fromDoc: any,
  fromText: string,
  toEditor: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toDoc: any,
  toText: string,
  style: ArrowStyle = "solid",
  fromOccurrence = 0,
  toOccurrence = 0
): Arrow {
  const fromPos = findInDoc(fromDoc, fromText, fromOccurrence)
  const toPos = findInDoc(toDoc, toText, toOccurrence)
  return {
    id: nextId(),
    from: {
      editorIndex: fromEditor,
      from: fromPos.from,
      to: fromPos.to,
      text: fromText,
    },
    to: {
      editorIndex: toEditor,
      from: toPos.from,
      to: toPos.to,
      text: toText,
    },
    arrowStyle: style,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ul(editorIndex: number, doc: any, text: string, occurrence = 0): LayerUnderline {
  const pos = findInDoc(doc, text, occurrence)
  return {
    id: nextId(),
    editorIndex,
    from: pos.from,
    to: pos.to,
    text,
  }
}

// ---------------------------------------------------------------------------
// Layer definitions
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function keyTheologicalTermsLayer(doc0: any, doc1: any): Layer {
  return {
    id: nextId(),
    name: "Key Theological Terms",
    color: "#fca5a5", // red-300
    visible: true,
    highlights: [
      // 1 Cor 1:18-31 (editor 0)
      hl(0, doc0, "the word of the cross"),
      hl(0, doc0, "power of God"),
      hl(0, doc0, "wisdom of the wise"),
      hl(0, doc0, "wisdom of the world"),
      hl(0, doc0, "Christ crucified"),
      hl(0, doc0, "the power of God and the wisdom of God"),
      hl(0, doc0, "foolishness of God"),
      hl(0, doc0, "righteousness and sanctification and redemption"),
      // 1 Cor 2:6-16 (editor 1)
      hl(1, doc1, "wisdom", 0),
      hl(1, doc1, "a secret and hidden wisdom of God"),
      hl(1, doc1, "Lord of glory"),
      hl(1, doc1, "the Spirit", 0),
      hl(1, doc1, "the Spirit of God", 0),
      hl(1, doc1, "The natural person"),
      hl(1, doc1, "the mind of Christ"),
    ],
    arrows: [],
    underlines: [],
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function contrastsAndParallelsLayer(doc0: any, doc1: any): Layer {
  return {
    id: nextId(),
    name: "Contrasts & Parallels",
    color: "#7dd3fc", // sky-300
    visible: true,
    highlights: [
      // 1 Cor 1:18 contrasts
      hl(0, doc0, "perishing"),
      hl(0, doc0, "being saved"),
      // 1 Cor 1:27 contrasts
      hl(0, doc0, "foolish in the world"),
      hl(0, doc0, "the wise", 1), // second "the wise" — after "to shame"
      hl(0, doc0, "weak in the world"),
      hl(0, doc0, "the strong"),
      // 1 Cor 2:12 contrasts
      hl(1, doc1, "the spirit of the world"),
      hl(1, doc1, "the Spirit who is from God"),
      // 1 Cor 2:14-15 contrasts
      hl(1, doc1, "natural person"),
      hl(1, doc1, "spiritual person"),
    ],
    arrows: [
      // Within editor 0 — contrasting pairs
      arrow(0, doc0, "perishing", 0, doc0, "being saved", "dashed"),
      arrow(0, doc0, "foolish in the world", 0, doc0, "the wise", "dashed", 0, 1),
      arrow(0, doc0, "weak in the world", 0, doc0, "the strong", "dashed"),
      // Within editor 1 — natural vs spiritual
      arrow(1, doc1, "natural person", 1, doc1, "spiritual person", "dashed"),
      // Cross-editor parallels
      arrow(0, doc0, "the wisdom of God", 1, doc1, "wisdom", "dotted", 0, 0),
      arrow(0, doc0, "folly", 1, doc1, "folly", "dotted", 0, 0),
    ],
    underlines: [],
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function structuralMarkersLayer(doc0: any, doc1: any): Layer {
  return {
    id: nextId(),
    name: "Structural Markers",
    color: "#6ee7b7", // emerald-300
    visible: true,
    highlights: [],
    arrows: [],
    underlines: [
      // 1 Cor 1:18-31 — logical connectors and transitions
      ul(0, doc0, "so that", 0), // v29
      ul(0, doc0, "so that", 1), // v31
      ul(0, doc0, "But God chose"), // v27 — major transition
      ul(0, doc0, "And because of him"), // v30
      // 1 Cor 2:6-16 — structural transitions
      ul(1, doc1, "Yet among the mature"), // v6 — opening
      ul(1, doc1, "these things God has revealed to us through the Spirit"), // v10 — key turning point
      ul(1, doc1, "But we have the mind of Christ"), // v16 — closing affirmation
    ],
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calvinistThemesLayer(doc0: any, doc1: any): Layer {
  return {
    id: nextId(),
    name: "Calvinist Themes",
    color: "#c4b5fd", // violet-300
    visible: true,
    highlights: [
      // Effectual calling (1 Cor 1:24)
      comment(
        0, doc0,
        "those who are called",
        "Effectual calling \u2014 not merely an external invitation, but an irresistible inward call by the Spirit that infallibly produces faith (cf. Rom 8:30). The \u2018called\u2019 (\u03ba\u03bb\u03b7\u03c4\u03bf\u03af\u03c2) are distinguished from those who reject the message."
      ),
      // Unconditional election (1 Cor 1:27-28)
      comment(
        0, doc0,
        "God chose what is foolish in the world to shame the wise; God chose what is weak in the world to shame the strong",
        "Unconditional election \u2014 the threefold repetition of \u2018God chose\u2019 (\u1f10\u03be\u03b5\u03bb\u03ad\u03be\u03b1\u03c4\u03bf) emphasizes sovereign divine initiative. Election is not based on human merit or foreseen faith but on God\u2019s free purpose alone."
      ),
      // Soli Deo Gloria (1 Cor 1:29)
      comment(
        0, doc0,
        "so that no human being might boast in the presence of God",
        "Soli Deo Gloria \u2014 the purpose of God\u2019s electing method is to eliminate all grounds for human boasting, directing all glory to God alone (cf. Eph 2:8\u20139)."
      ),
      // Monergism (1 Cor 1:30)
      comment(
        0, doc0,
        "because of him you are in Christ Jesus",
        "Monergistic union \u2014 the Greek \u1f10\u03be \u03b1\u1f50\u03c4\u03bf\u1fe6 (\u2018from him\u2019) makes clear that our being \u2018in Christ\u2019 originates entirely from God\u2019s action, not our own decision or effort."
      ),
      // Eternal decree (1 Cor 2:7)
      comment(
        1, doc1,
        "which God decreed before the ages for our glory",
        "God\u2019s eternal decree \u2014 this wisdom was planned before creation, part of God\u2019s eternal purpose (\u03c0\u03c1\u03bf\u03c9\u03c1\u03af\u03b6\u03c9, \u2018predestined\u2019). Cf. Eph 1:4\u20135, the election of believers before the foundation of the world."
      ),
      // Total inability (1 Cor 2:14)
      comment(
        1, doc1,
        "The natural person does not accept the things of the Spirit of God, for they are folly to him, and he is not able to understand them",
        "Total inability \u2014 the \u03c8\u03c5\u03c7\u03b9\u03ba\u1f78\u03c2 \u1f04\u03bd\u03b8\u03c1\u03c9\u03c0\u03bf\u03c2 (natural/soulish person) is not merely unwilling but unable (\u03bf\u1f50 \u03b4\u03cd\u03bd\u03b1\u03c4\u03b1\u03b9) to discern spiritual truth apart from the Spirit\u2019s illumination. This is a key text for the Reformed doctrine of total depravity."
      ),
      // Effectual grace (1 Cor 2:16)
      comment(
        1, doc1,
        "we have the mind of Christ",
        "Effectual grace and illumination \u2014 believers possess spiritual understanding not by their own capacity but by the Spirit\u2019s gift (v12), which enables them to comprehend what God has freely given. The \u2018mind of Christ\u2019 (\u03bd\u03bf\u1fe6\u03bd \u03a7\u03c1\u03b9\u03c3\u03c4\u03bf\u1fe6) is a present possession of all who are in Christ."
      ),
    ],
    arrows: [],
    underlines: [],
  }
}
