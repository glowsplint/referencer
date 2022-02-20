import React, { useState } from 'react';
import { Format, Regex } from '../common/constants';
import { SetTexts, TextInfo, Texts } from '../components/types';

const baseTexts: Texts = {
  headers: [],
  bodies: [],
  isDisplayed: [],
};

const TextsContext = React.createContext<{
  texts: Texts;
  setTexts: SetTexts;
}>({
  texts: baseTexts,
  setTexts: () => {},
});

/* Parsing functions */
// Splits the original string into the main body of text, and also footnotes
const splitTexts = (text: string): [string[], string[]] => {
  const splitOnParagraphs = (text: string): string[] =>
    text.split(Regex.Paragraph);
  const footnoteIndex = splitOnParagraphs(text).indexOf("Footnotes");
  let footnotes: string[] = [];
  let mainText: string[] = splitOnParagraphs(text);
  if (footnoteIndex !== -1) {
    footnotes = splitOnParagraphs(text).slice(footnoteIndex);
    mainText = splitOnParagraphs(text).slice(0, footnoteIndex);
  }
  return [mainText, footnotes];
};

// Adds a space conditionally
const addSpace = (brokenTextItem: string): string => {
  if (brokenTextItem !== "" && !brokenTextItem.endsWith("\n")) {
    return brokenTextItem + " ";
  }
  return brokenTextItem;
};

// Parsing entry point
const processTexts = (text: string) => {
  const [rawMainText, rawFootnotes] = splitTexts(text);
  const mainText = getMainText(rawMainText);
  const footnotes = getFootnotes(rawFootnotes);
  return { mainText, footnotes };
};

// The primary parsing engine that creates an array that contains the formatting information for each block of text
const getMainText = (rawMainText: string[]): TextInfo[] => {
  const brokenText = rawMainText.slice(1).flatMap((a) =>
    a
      .split(Regex.VerseNumberInText)
      .flatMap((b) => b.split(Regex.SpecialNoteInText))
      .flatMap((c) => c.split(Regex.TripleLineFeed))
      .flatMap((d) => d.split(Regex.TripleLineFeedAtEnd))
  );
  let mainText: TextInfo[] = [];
  let isFirstVerseNumberFound: boolean = false; // flag tracker

  // Spaces are added at the end of strings (via addSpace) to have proper spacing around verse numbers
  for (let [index, item] of brokenText.entries()) {
    const getFormat = () => {
      if (item.match(Regex.VerseNumber)) {
        if (!isFirstVerseNumberFound) {
          isFirstVerseNumberFound = true;
        }
        return Format.VerseNumber;
      } else {
        // Everything before the first verse number is found is a SectionHeader
        if (!isFirstVerseNumberFound) {
          return Format.SectionHeader;
        } else if (item.match(Regex.SpecialNoteInText)) {
          return Format.SpecialNote;
        } else if (item.match(Regex.Quotes)) {
          // If the quote (") begins at the start of the verse, format as StandardText
          // or, if the quote (") is in Psalms, format as StandardText
          brokenText[index] = addSpace(brokenText[index]);
          if (
            mainText[index - 1].format === Format.VerseNumber ||
            rawMainText[0].match(Regex.Psalm)
          ) {
            return Format.StandardText;
          } else {
            return Format.Quotes;
          }
          // Triple Line Feeds at the end of the string are parsed as new paragraphs
        } else if (item.match(Regex.TripleLineFeedAtEnd)) {
          return Format.TripleLineFeedAtEnd;
          // If the previous item in the array is StandardText, then this should be a SectionHeader
          // if it is not Psalm 42:6 (exception to the rule)
        } else if (mainText[index - 1].format === Format.StandardText) {
          if (item.endsWith("\n")) {
            return Format.Psalm426;
          }
          return Format.SectionHeader;
        } else {
          brokenText[index] = addSpace(brokenText[index]);
          return Format.StandardText;
        }
      }
    };
    mainText[index] = { id: index, format: getFormat(), text: item };
  }
  return mainText;
};

// The secondary parsing engine (for footnotes only) that creates an array with formatting information
const getFootnotes = (rawFootnotes: string[]): TextInfo[] => {
  const footnotes = rawFootnotes.map((footnoteText, index) => {
    return {
      id: index,
      format: index === 0 ? Format.SectionHeader : Format.FootnoteText,
      text: footnoteText,
    };
  });
  return footnotes;
};

/* Context Provider for texts */
const TextsProvider = ({ children }: { children: React.ReactNode }) => {
  const [texts, setTexts] = useState(baseTexts);

  return (
    <TextsContext.Provider value={{ texts, setTexts }}>
      {children}
    </TextsContext.Provider>
  );
};

const useTexts = () => {
  return React.useContext(TextsContext);
};

export { useTexts, TextsProvider, processTexts };
