// Default workspace data for the Bible study demo.
// Provides two passage contents (Genesis 1:1-31, Revelation 21:1-27),
// four pre-populated annotation layers for inductive study, and a placeholder
// for new editors.
import contentGenesis1 from "./default-content-genesis1.json";
import contentRev21 from "./default-content-rev21.json";
import placeholderContent from "./placeholder-content.json";
import type { Layer, Highlight, Arrow, LayerUnderline, ArrowStyle } from "@/types/editor";

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const DEFAULT_PASSAGE_CONTENTS: Record<string, unknown>[] = [
  contentGenesis1 as Record<string, unknown>,
  contentRev21 as Record<string, unknown>,
];

export const DEFAULT_SECTION_NAMES = ["Genesis 1:1\u201331", "Revelation 21:1\u201327"];

export const PLACEHOLDER_CONTENT = placeholderContent as Record<string, unknown>;

export function createDefaultLayers(): Layer[] {
  const doc0 = contentGenesis1;
  const doc1 = contentRev21;
  return [
    parallelsLayer(doc0, doc1),
    reversalsLayer(doc0, doc1),
    covenantAndTempleLayer(doc0, doc1),
    structuralPatternsLayer(doc0, doc1),
  ];
}

// ---------------------------------------------------------------------------
// ProseMirror position calculator
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNodeText(node: any): string {
  if (node.type === "text") return node.text || "";
  if (!node.content) return "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return node.content.map((n: any) => getNodeText(n)).join("");
}

interface Pos {
  from: number;
  to: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findInDoc(doc: any, search: string, occurrence = 0): Pos {
  let pos = 0;
  let found = 0;

  for (const node of doc.content) {
    pos += 1; // entering block node
    const text = getNodeText(node);
    let searchFrom = 0;
    let idx: number;
    while ((idx = text.indexOf(search, searchFrom)) !== -1) {
      if (found === occurrence) {
        return { from: pos + idx, to: pos + idx + search.length };
      }
      found++;
      searchFrom = idx + 1;
    }
    pos += text.length;
    pos += 1; // leaving block node
  }

  throw new Error(`Text not found in doc: "${search}" (occurrence ${occurrence})`);
}

// ---------------------------------------------------------------------------
// Annotation helpers
// ---------------------------------------------------------------------------

let idCounter = 0;
function nextId(): string {
  return `default-${++idCounter}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hl(editorIndex: number, doc: any, text: string, occurrence = 0): Highlight {
  const pos = findInDoc(doc, text, occurrence);
  return {
    id: nextId(),
    editorIndex,
    from: pos.from,
    to: pos.to,
    text,
    annotation: "",
    type: "highlight",
    visible: true,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cm(editorIndex: number, doc: any, text: string, annotation: string, occurrence = 0): Highlight {
  const pos = findInDoc(doc, text, occurrence);
  return {
    id: nextId(),
    editorIndex,
    from: pos.from,
    to: pos.to,
    text,
    annotation,
    type: "comment",
    visible: true,
  };
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
  toOccurrence = 0,
): Arrow {
  const fromPos = findInDoc(fromDoc, fromText, fromOccurrence);
  const toPos = findInDoc(toDoc, toText, toOccurrence);
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
    visible: true,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ul(editorIndex: number, doc: any, text: string, occurrence = 0): LayerUnderline {
  const pos = findInDoc(doc, text, occurrence);
  return {
    id: nextId(),
    editorIndex,
    from: pos.from,
    to: pos.to,
    text,
    visible: true,
  };
}

// ---------------------------------------------------------------------------
// Layer 1 — Parallels: Creation → New Creation
// Arrows and highlights connecting direct echoes between the two passages.
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parallelsLayer(doc0: any, doc1: any): Layer {
  return {
    id: nextId(),
    name: "Parallels: Creation \u2192 New Creation",
    color: "#fbbf24", // amber-400
    visible: true,
    highlights: [
      // Genesis 1 — parallel anchor texts
      hl(0, doc0, "God created the heavens and the earth"),
      hl(0, doc0, "he called Seas"),
      hl(0, doc0, "Let there be light"),
      hl(0, doc0, "the greater light to rule the day and the lesser light to rule the night"),
      hl(0, doc0, "And there was evening and there was morning"),
      hl(0, doc0, "it was very good"),
      hl(0, doc0, "let them have dominion"),
      // Revelation 21 — corresponding echoes
      hl(1, doc1, "a new heaven and a new earth"),
      hl(1, doc1, "the sea was no more"),
      hl(1, doc1, "the glory of God gives it light"),
      hl(1, doc1, "no need of sun or moon to shine on it"),
      hl(1, doc1, "there will be no night there"),
      hl(1, doc1, "I am making all things new"),
      hl(1, doc1, "the kings of the earth will bring their glory into it"),
    ],
    arrows: [
      // Heavens & earth → new heaven & new earth
      arrow(0, doc0, "God created the heavens and the earth", 1, doc1, "a new heaven and a new earth", "solid"),
      // Seas created → sea no more
      arrow(0, doc0, "he called Seas", 1, doc1, "the sea was no more", "solid"),
      // Let there be light → glory of God is its light
      arrow(0, doc0, "Let there be light", 1, doc1, "the glory of God gives it light", "solid"),
      // Sun & moon → no need of sun or moon
      arrow(0, doc0, "the greater light to rule the day and the lesser light to rule the night", 1, doc1, "no need of sun or moon to shine on it", "solid"),
      // Evening & morning cycle → no night
      arrow(0, doc0, "And there was evening and there was morning", 1, doc1, "there will be no night there", "solid"),
      // Very good → all things new
      arrow(0, doc0, "it was very good", 1, doc1, "I am making all things new", "solid"),
      // Dominion mandate → kings bring glory
      arrow(0, doc0, "let them have dominion", 1, doc1, "the kings of the earth will bring their glory into it", "dotted"),
    ],
    underlines: [],
  };
}

// ---------------------------------------------------------------------------
// Layer 2 — What the New Creation Reverses
// Comments explaining the great reversals from fall to consummation.
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function reversalsLayer(doc0: any, doc1: any): Layer {
  return {
    id: nextId(),
    name: "What the New Creation Reverses",
    color: "#fb7185", // rose-400
    visible: true,
    highlights: [
      cm(
        0,
        doc0,
        "darkness was over the face of the deep",
        "The primordial state of tohu wabohu (\u201cformless and void\u201d) with darkness over the deep " +
          "represents raw, unordered reality before God\u2019s creative Word brought light and structure. " +
          "In the new creation (Rev 21:23\u201325), darkness is wholly overcome\u2014God\u2019s own glory is the " +
          "eternal, unceasing light. The chaos that marked the beginning will have no place in the end.",
      ),
      cm(
        1,
        doc1,
        "the sea was no more",
        "In biblical symbolism the sea represents chaos, evil, and opposition to God (cf. Gen 1:2; " +
          "Ps 74:13\u201314; Isa 27:1; Rev 13:1). God\u2019s original creation involved ordering chaos " +
          "(Gen 1:2\u201310). The sea\u2019s removal signals the complete and permanent elimination of every " +
          "source of disorder, danger, and threat. God\u2019s ordering work in creation reaches its " +
          "final, irreversible consummation.",
      ),
      cm(
        1,
        doc1,
        "death shall be no more, neither shall there be mourning, nor crying, nor pain anymore",
        "Death entered through Adam\u2019s sin (Gen 2:17; Rom 5:12). Every bitter fruit of the fall\u2014" +
          "grief, tears, suffering, mortality\u2014is here permanently abolished. Christ as the last Adam " +
          "(1 Cor 15:22, 45) undoes what the first Adam brought upon the human race. This is not " +
          "mere comfort but the cosmic reversal of the curse (cf. Gen 3:16\u201319).",
      ),
      cm(
        1,
        doc1,
        "the former things have passed away",
        "The Greek kainos (\u201cnew\u201d) denotes new in quality and character, not neos (\u201cnew in time\u201d). " +
          "God does not discard His creation but gloriously transforms it (Rom 8:21). There is both " +
          "continuity and discontinuity: the same creation, yet freed from its bondage to decay and " +
          "brought to the glory it was always intended to reach. Resurrection, not replacement.",
      ),
      cm(
        1,
        doc1,
        "nothing unclean will ever enter it",
        "Unlike Eden, where the serpent entered and temptation was possible, the new creation is " +
          "eternally secure against sin. This is the great eschatological advantage over the " +
          "original creation: glorified saints in confirmed righteousness can never fall. The " +
          "consummation surpasses the beginning\u2014what Vos calls the eschatological state that Adam " +
          "was meant to attain but never did.",
      ),
    ],
    arrows: [],
    underlines: [],
  };
}

// ---------------------------------------------------------------------------
// Layer 3 — Covenant & Temple Theology
// Comments with reformed theological insights on covenant fulfillment,
// temple expansion, bride imagery, and Trinitarian creation.
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function covenantAndTempleLayer(doc0: any, doc1: any): Layer {
  return {
    id: nextId(),
    name: "Covenant & Temple Theology",
    color: "#6ee7b7", // emerald-300
    visible: true,
    highlights: [
      cm(
        0,
        doc0,
        "the Spirit of God was hovering over the face of the waters",
        "The Spirit\u2019s creative presence here anticipates His role throughout redemptive history. " +
          "As the Spirit hovered over chaotic waters to bring forth ordered life, He now indwells " +
          "believers as the \u201cfirstfruits\u201d and \u201cguarantee\u201d of new creation (Rom 8:23; 2 Cor 1:22; " +
          "5:5). The Spirit\u2019s work in regeneration is itself a foretaste of cosmic renewal\u2014every " +
          "conversion is a miniature new creation (2 Cor 5:17).",
      ),
      cm(
        0,
        doc0,
        "Let us make man in our image, after our likeness",
        "The divine plural \u201cus\u201d reveals the Trinitarian nature of God at work in creation " +
          "(cf. Gen 1:2, the Spirit; John 1:1\u20133, the Word/Logos). Humanity as imago Dei is the " +
          "crown and purpose of creation. In the new creation, redeemed image-bearers will fully " +
          "and eternally reflect God\u2019s glory (2 Cor 3:18; 1 John 3:2)\u2014what Adam was always " +
          "meant to become but forfeited through the fall.",
      ),
      cm(
        1,
        doc1,
        "the dwelling place of God is with man. He will dwell with them, and they will be his people, and God himself will be with them as their God",
        "The covenant formula (\u201cI will be their God, they will be my people\u201d) reaches its " +
          "ultimate fulfillment. This golden thread runs from Gen 17:7\u20138 \u2192 Ex 29:45 \u2192 " +
          "Jer 31:33 \u2192 Ezek 37:27, culminating here. God\u2019s presence, once mediated through " +
          "tabernacle and temple, is now direct and permanent. The entire telos of redemptive " +
          "history\u2014God dwelling with His people\u2014is accomplished.",
      ),
      cm(
        1,
        doc1,
        "I saw no temple in the city, for its temple is the Lord God the Almighty and the Lamb",
        "Beale\u2019s temple theology illuminates the whole arc: Eden was the archetypal temple-garden " +
          "where God walked with man (Gen 3:8). Israel\u2019s tabernacle and temple replicated Eden\u2019s " +
          "sacred space. Christ declared Himself the true temple (John 2:19\u201321). The church is the " +
          "Spirit\u2019s temple (1 Cor 3:16). Now the entire new creation is temple\u2014God\u2019s presence " +
          "fills all reality. No mediating structure is needed because sin is no more.",
      ),
      cm(
        1,
        doc1,
        "the holy city, new Jerusalem, coming down out of heaven from God, prepared as a bride adorned for her husband",
        "The New Jerusalem is simultaneously a place and a people\u2014the glorified Church, the Bride " +
          "of Christ. This fulfills the marriage typology running from Adam and Eve (Gen 2:23\u201324) " +
          "through Israel as God\u2019s bride (Hosea) to the Church (Eph 5:25\u201332). The city descends " +
          "from heaven: new creation is God\u2019s gracious gift, not human achievement (sola gratia).",
      ),
      cm(
        1,
        doc1,
        "I am the Alpha and the Omega, the beginning and the end",
        "The God who spoke creation into being through His powerful Word (\u201cAnd God said\u2026\u201d ten " +
          "times in Genesis 1) is the same God who consummates all things. Redemptive history is " +
          "teleological\u2014it moves purposefully from the decree of creation to the decree of " +
          "consummation. Christ, the eternal Logos (John 1:1\u20133), is both the agent of the first " +
          "creation and the Lord of the new.",
      ),
      cm(
        1,
        doc1,
        "The one who conquers will have this heritage, and I will be his God and he will be my son",
        "The covenant inheritance language echoes the Abrahamic promise (Gen 17:7\u20138), now " +
          "cosmically expanded. \u201cHeritage\u201d (kl\u0113ronomia) connects to the land promise fulfilled " +
          "in new creation\u2014the entire renewed cosmos becomes the inheritance. \u201cHe will be my " +
          "son\u201d\u2014adoption reaches its climax. Believers as co-heirs with Christ (Rom 8:17) " +
          "receive what Adam was promised but forfeited.",
      ),
    ],
    arrows: [],
    underlines: [],
  };
}

// ---------------------------------------------------------------------------
// Layer 4 — Structural Patterns
// Underlines marking repeated refrains and literary structures.
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function structuralPatternsLayer(doc0: any, doc1: any): Layer {
  return {
    id: nextId(),
    name: "Structural Patterns",
    color: "#c4b5fd", // violet-300
    visible: true,
    highlights: [],
    arrows: [],
    underlines: [
      // Genesis 1 — "And God said" creative-word refrain (select representative occurrences)
      ul(0, doc0, "And God said", 0), // v3 — light
      ul(0, doc0, "And God said", 1), // v6 — expanse
      ul(0, doc0, "And God said", 2), // v9 — dry land
      ul(0, doc0, "And God said", 4), // v14 — luminaries
      ul(0, doc0, "And God said", 5), // v20 — sea creatures & birds
      ul(0, doc0, "And God said", 6), // v24 — land creatures
      ul(0, doc0, "Then God said"),    // v26 — man (distinct "Then")

      // Genesis 1 — "it was good" evaluation refrain
      ul(0, doc0, "And God saw that it was good", 0), // v10
      ul(0, doc0, "And God saw that it was good", 2), // v18
      ul(0, doc0, "And God saw that it was good", 4), // v25
      ul(0, doc0, "it was very good"),                 // v31 — climactic

      // Genesis 1 — day-closing refrain
      ul(0, doc0, "And there was evening and there was morning, the first day"),
      ul(0, doc0, "And there was evening and there was morning, the sixth day"),

      // Revelation 21 — visionary markers
      ul(1, doc1, "Then I saw"),   // v1
      ul(1, doc1, "And I saw", 0), // v2
      ul(1, doc1, "And I heard"),  // v3
      ul(1, doc1, "And I saw", 1), // v22

      // Revelation 21 — "Behold" divine declarations
      ul(1, doc1, "Behold", 0), // v3 — dwelling of God
      ul(1, doc1, "Behold", 1), // v5 — all things new
    ],
  };
}
