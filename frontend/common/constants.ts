const DEVELOPMENT_MODE = process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === "True";
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION;

const scrollbarWidth = 10;

enum Format {
  FootnoteText = "FootnoteText",
  Psalm426 = "Psalm426",
  Quotes = "Quotes",
  SectionHeader = "SectionHeader",
  SpecialNote = "SpecialNote",
  StandardText = "StandardText",
  TripleLineFeedAtEnd = "TripleLineFeedAtEnd",
  VerseNumber = "VerseNumber",
}

const Regex = {
  CompleteWord: /^\w*$/,
  InlineFootnote: /(\(\d+\))/g,
  Paragraph: /\n\n/,
  Psalm: /^(Psalm)/,
  Quotes: /^[ ]*“.*?$/,
  SpecialNoteInText: /^(\[.*?\]\(\d+\))$/,
  TripleLineFeed: /(?:\n[ ]{4}){3}/,
  TripleLineFeedAtEnd: /((?:\n[ ]{4}){2}\n)/,
  VerseNumber: /^\d+$/,
  VerseNumberInText: /[ ]*\[(\d+)\]/,
  WithinAsterisks: /(\*.*?\*)/,
  WordBoundary: /\b/,
};

enum SelectionMode {
  None = "None",
  Arrowing = "Arrowing",
  Selecting = "Selecting",
}

export {
  APP_VERSION,
  DEVELOPMENT_MODE,
  Format,
  Regex,
  SelectionMode,
  scrollbarWidth,
};
