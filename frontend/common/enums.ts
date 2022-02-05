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

const REGEX = {
  completeWord: /^\w*$/,
  inlineFootnote: /(\(\d+\))/g,
  paragraph: /\n\n/,
  psalm: /^(Psalm)/,
  quotes: /^[ ]*“.*?$/,
  specialNoteInText: /^(\[.*?\]\(\d+\))$/,
  tripleLineFeed: /(?:\n[ ]{4}){3}/,
  tripleLineFeedAtEnd: /((?:\n[ ]{4}){2}\n)/,
  verseNumber: /^\d+$/,
  verseNumberInText: /[ ]*\[(\d+)\]/,
  withinAsterisks: /(\*.*?\*)/,
  wordBoundary: /\b/,
};

enum SelectionMode {
  None = "None",
  Arrowing = "Arrowing",
  Selecting = "Selecting",
}

export { Format, REGEX, SelectionMode };
