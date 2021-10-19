import React, { useState } from "react";
import { REGEX, Format } from "../common/enums";

type Texts = {
  headers: string[];
  bodies: string[];
  isDisplayed: boolean[];
};

export type DisplayedTexts = {
  headers: string[];
  bodies: DisplayedBody[];
};

export type DisplayedBody = {
  mainText: TextInfo[];
  footnotes: TextInfo[];
};

type TextState = {
  texts: Texts;
  displayedTexts: DisplayedTexts;
  setTexts: (newTexts: Texts) => void;
};

type TextType =
  | Format
  | "Quotes"
  | "ParagraphSpacer"
  | "IndentedVerseNumber"
  | "InlineVerseNumber"
  | "SectionHeader"
  | "SpecialNote"
  | "Italics"
  | "InlineFootnote"
  | "ItalicsBlock";

interface TextInfo {
  text: string;
  format: TextType;
}

const TextsContext = React.createContext<Partial<TextState>>({});

/* Parsing functions */
// Splits the original string into the main body of text, and also footnotes
const splitTexts = (text: string): [string[], string[]] => {
  const splitOnParagraphs = (text: string): string[] =>
    text.split(REGEX.paragraph);
  const footnoteIndex = splitOnParagraphs(text).indexOf("Footnotes");
  let footnotes = [];
  let mainText = splitOnParagraphs(text);
  if (footnoteIndex !== -1) {
    footnotes = splitOnParagraphs(text).slice(footnoteIndex);
    mainText = splitOnParagraphs(text).slice(0, footnoteIndex);
  }
  return [mainText, footnotes];
};

const addSpace = (brokenTextIndex: string): string => {
  if (brokenTextIndex !== "" && !brokenTextIndex.endsWith("\n")) {
    return brokenTextIndex + " ";
  }
  return brokenTextIndex;
};

// The primary parsing engine that creates an array that contains the formatting information for each block of text
const getMainText = (rawMainText: string[]): TextInfo[] => {
  const brokenText = rawMainText.slice(1).flatMap((a) =>
    a
      .split(REGEX.verseNumberInText)
      .flatMap((b) => b.split(REGEX.specialNoteInText))
      .flatMap((c) => c.split(REGEX.tripleLineFeed))
      .flatMap((d) => d.split(REGEX.tripleLineFeedAtEnd))
  );
  let mainText: TextInfo[] = [];
  let isFirstVerseNumberFound: boolean = false; // flag tracker

  // Spaces are added at the end of strings (via addSpace) to have proper spacing around verse numbers
  for (let [index, item] of brokenText.entries()) {
    mainText[index] = { format: undefined, text: item };

    if (item.match(REGEX.verseNumber)) {
      mainText[index].format = Format.VerseNumber;
      if (!isFirstVerseNumberFound) {
        isFirstVerseNumberFound = true;
      }
    } else {
      // Everything before the first verse number is found is a SectionHeader
      if (!isFirstVerseNumberFound) {
        mainText[index].format = Format.SectionHeader;
      } else if (item.match(REGEX.specialNoteInText)) {
        mainText[index].format = Format.SpecialNote;
      } else if (item.match(REGEX.quotes)) {
        // If the quote (") begins at the start of the verse, format as StandardText
        // or, if the quote (") is in Psalms, format as StandardText
        if (
          mainText[index - 1].format === Format.VerseNumber ||
          rawMainText[0].match(REGEX.psalm)
        ) {
          mainText[index].format = Format.StandardText;
        } else {
          mainText[index].format = Format.Quotes;
        }
        brokenText[index] = addSpace(brokenText[index]);
        // Triple Line Feeds at the end of the string are parsed as new paragraphs
      } else if (item.match(REGEX.tripleLineFeedAtEnd)) {
        mainText[index].format = Format.TripleLineFeedAtEnd;
        // If the previous item in the array is StandardText, then this should be a SectionHeader
        // if it is not Psalm 42:6 (exception to the rule)
      } else if (mainText[index - 1].format === Format.StandardText) {
        if (item.endsWith("\n")) {
          mainText[index].format = Format.Psalm426;
        } else {
          mainText[index].format = Format.SectionHeader;
        }
      } else {
        mainText[index].format = Format.StandardText;
        brokenText[index] = addSpace(brokenText[index]);
      }
    }
  }
  return mainText;
};

// The secondary parsing engine (for footnotes only) that creates an array with formatting information
const getFootnotes = (rawFootnotes: string[]): TextInfo[] => {
  const footnotes = rawFootnotes.map((footnoteText, index) => {
    return {
      format: index === 0 ? Format.SectionHeader : Format.FootnoteText,
      text: footnoteText,
    };
  });
  return footnotes;
};

/* Context Provider for texts */
export const TextsProvider = ({ children }) => {
  const display = (newTexts: Texts): DisplayedTexts => {
    const indices: number[] = newTexts.isDisplayed.flatMap((bool, index) =>
      bool ? index : []
    );

    const processTexts = (text: string) => {
      const [rawMainText, rawFootnotes] = splitTexts(text);
      const mainText = getMainText(rawMainText);
      const footnotes = getFootnotes(rawFootnotes);
      return { mainText, footnotes };
    };

    let headers: string[] = [];
    let bodies: DisplayedBody[] = [];
    for (let item of indices) {
      headers.push(newTexts.headers[item]);
      bodies.push(processTexts(newTexts.bodies[item]));
    }

    return { headers, bodies };
  };

  const [textInfo, setTextInfo] = useState<TextState>({
    texts: { headers: [], bodies: [], isDisplayed: [] },
    displayedTexts: { headers: [], bodies: [] },
    setTexts: (newTexts: Texts) => {
      setTextInfo({
        texts: newTexts,
        displayedTexts: display(newTexts),
        setTexts: textInfo.setTexts,
      });
    },
  });

  return (
    <TextsContext.Provider value={textInfo}>{children}</TextsContext.Provider>
  );
};

export const useTexts = () => {
  return React.useContext(TextsContext);
};
