import React, { useState } from "react";
import { REGEX, Format } from "../enums/enums";

type Texts = {
  headers: string[];
  bodies: string[];
  isDisplayed: boolean[];
};

type DisplayedTexts = {
  headers: string[];
  bodies: DisplayedBody[];
};

export type DisplayedBody = {
  formatMainText: string[];
  brokenText: string[];
  formatFootnotes: string[];
  brokenFootnotes: string[];
};

type TextState = {
  texts: Texts;
  displayedTexts: DisplayedTexts;
  setTexts: (newTexts: Texts) => void;
};

const TextsContext = React.createContext<Partial<TextState>>({});

export const TextsProvider = ({ children }) => {
  const display = (newTexts: Texts): DisplayedTexts => {
    const indices: number[] = newTexts.isDisplayed.flatMap((bool, index) =>
      bool ? index : []
    );

    const processTexts = (text: string) => {
      const splitTexts = (text: string): [string[], string[]] => {
        // Splits the original string into the main body of text, and also footnotes
        const splitOnParagraphs = (text: string): string[] =>
          text.split(REGEX.paragraphs);
        const footnoteIndex = splitOnParagraphs(text).indexOf("Footnotes");
        let footnotes = [];
        let mainText = splitOnParagraphs(text);
        if (footnoteIndex !== -1) {
          footnotes = splitOnParagraphs(text).slice(footnoteIndex);
          mainText = splitOnParagraphs(text).slice(0, footnoteIndex);
        }
        return [mainText, footnotes];
      };

      const getFormatMainText = (mainText: string[]): [string[], string[]] => {
        // The primary parsing engine that creates an array that contains the formatting information for each block of text
        const brokenText = mainText.slice(1).flatMap((a) =>
          a
            .split(REGEX.verseNumberInText)
            .flatMap((b) => b.split(REGEX.specialNoteInText))
            .flatMap((c) => c.split(REGEX.hasTripleLineFeed))
            .flatMap((d) => d.split(REGEX.hasTripleLineFeedAtEnd))
        );
        let format: string[] = [];
        let firstVerseNumberFound: boolean = false;

        const addSpace = (brokenTextIndex: string): string => {
          if (brokenTextIndex !== "" && !brokenTextIndex.endsWith("\n")) {
            return brokenTextIndex + " ";
          }
          return brokenTextIndex;
        };

        // Spaces are added at the end of strings (via addSpace) to have proper spacing around verse numbers
        for (let [index, item] of brokenText.entries()) {
          if (item.match(REGEX.verseNumber)) {
            format[index] = Format.VerseNumber;
            if (!firstVerseNumberFound) {
              firstVerseNumberFound = true;
            }
          } else {
            // Everything before the first verse number is found is a SectionHeader
            // firstVerseNumberFound is a flag to track that
            if (!firstVerseNumberFound) {
              format[index] = Format.SectionHeader;
            } else if (item.match(REGEX.specialNoteInText)) {
              format[index] = Format.SpecialNote;
            } else if (item.match(REGEX.quotes)) {
              // If the quote (") begins at the start of the verse, format as StandardText
              // or, if the quote (") is in Psalms, format as StandardText
              if (
                format[index - 1] === Format.VerseNumber ||
                mainText[0].match(REGEX.isPsalm)
              ) {
                format[index] = Format.StandardText;
              } else {
                format[index] = Format.Quotes;
              }
              brokenText[index] = addSpace(brokenText[index]);
              // Triple Line Feeds at the end of the string are parsed as new paragraphs
            } else if (item.match(REGEX.hasTripleLineFeedAtEnd)) {
              format[index] = Format.HasTripleLineFeedAtEnd;
              // If the previous item in the array is StandardText, this one should be a SectionHeader
              // if it is not Psalm 42:6 (exception to the rule)
            } else if (format[index - 1] === Format.StandardText) {
              if (item.endsWith("\n")) {
                format[index] = Format.Psalm426;
              } else {
                format[index] = Format.SectionHeader;
              }
            } else {
              format[index] = Format.StandardText;
              brokenText[index] = addSpace(brokenText[index]);
            }
          }
        }
        return [format, brokenText];
      };

      const getFormatFootnotes = (footnotes: string[]) => {
        // The secondary parsing engine (for footnotes only) that creates an array with formatting information
        let format: string[] = Array(footnotes.length).fill(
          Format.FootnoteText
        );
        format[0] = Format.SectionHeader;
        return [format, footnotes];
      };

      const [mainText, footnotes] = splitTexts(text);
      const [formatMainText, brokenText] = getFormatMainText(mainText);
      const [formatFootnotes, brokenFootnotes] = getFormatFootnotes(footnotes);
      return { formatMainText, brokenText, formatFootnotes, brokenFootnotes };
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
