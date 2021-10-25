import { blue, green, orange, purple, yellow } from "@mui/material/colors";

export enum Format {
  FootnoteText = "FootnoteText",
  Psalm426 = "Psalm426",
  Quotes = "Quotes",
  SectionHeader = "SectionHeader",
  SpecialNote = "SpecialNote",
  StandardText = "StandardText",
  TripleLineFeedAtEnd = "TripleLineFeedAtEnd",
  VerseNumber = "VerseNumber",
}

export const COLOURS = {
  Orange: orange[400],
  Yellow: yellow[500],
  Green: green[300],
  Blue: blue[300],
  Purple: purple[300],
};

type Colour = {
  Orange: string;
  Yellow: string;
  Green: string;
  Blue: string;
  Purple: string;
};

export type ColourType = keyof Colour;
type ValueOf<T> = T[keyof T];
export type ColourValueType = ValueOf<Colour>;

export const REGEX = {
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

export enum SelectionMode {
  None,
  Drawing,
  Selecting,
}
