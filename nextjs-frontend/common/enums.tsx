import { blue, green, orange, purple, yellow } from "@material-ui/core/colors";

export enum Format {
  SectionHeader = "SectionHeader",
  VerseNumber = "VerseNumber",
  StandardText = "StandardText",
  Quotes = "Quotes",
  SpecialNote = "SpecialNote",
  FootnoteText = "FootnoteText",
  Psalm426 = "Psalm426",
  HasTripleLineFeedAtEnd = "HasTripleLineFeedAtEnd",
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
  footnoteInText: /(?<!])(\(\d+\))/,
  specialNoteInText: /^(\[.*?\]\(\d+\))$/,
  verseNumberInText: /[ ]*\[(\d+)\]/,
  hasTripleLineFeed: /(?:\n[ ]{4}){3}/,
  hasTripleLineFeedAtEnd: /((?:\n[ ]{4}){2}\n)/,
  inlineFootnote: /(\(\d+\))/g,
  italics: /(\*.*?\*)/,
  paragraphs: /\n\n/,
  quotes: /^[ ]*“.*?$/,
  specialNote: /(\[.*?\])/,
  verseNumber: /^\d+$/,
  whitespace: /^([ ]+)$/,
  whitespaceAfterWord: /([ ])/,
  isPsalm: /^(Psalm)/,
};
