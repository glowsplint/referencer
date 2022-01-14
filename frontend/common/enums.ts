import { blue, green, orange, purple, yellow } from "@mui/material/colors";

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

const COLOURS = {
  Orange: { highlight: orange[400], arrow: orange[900] },
  Yellow: { highlight: yellow[500], arrow: yellow[900] },
  Green: { highlight: green[300], arrow: green[900] },
  Blue: { highlight: blue[300], arrow: blue[900] },
  Purple: { highlight: purple[300], arrow: purple[900] },
};

interface IColour {
  highlight: ColourValueType;
  arrow: ColourValueType;
}

type Colour = {
  Orange: IColour;
  Yellow: IColour;
  Green: IColour;
  Blue: IColour;
  Purple: IColour;
};

type ColourType = keyof Colour;
type ColourValueType = string;

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

export type { ColourType, ColourValueType, IColour };
export { COLOURS, Format, REGEX, SelectionMode };
