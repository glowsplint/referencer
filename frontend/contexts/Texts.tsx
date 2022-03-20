import _ from 'lodash';
import React, { useState } from 'react';
import { Format, Regex } from '../common/constants';
import {
  SetTexts,
  TextInfo,
  Texts,
  TextType
  } from '../common/types';


const baseTexts: Texts = {
  passages: [],
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

// Parsing entry point
const parseTexts = (text: string, max_header_length = 100): TextInfo[] => {
  // # parse
  const parsedList: {
    format: Format;
    lineId: number;
    text: string;
  }[] = []; // # init output list
  const brokenText = text.split("\n"); // # linebreaks

  // # iterate by line
  for (const lineId of _.range(0, brokenText.length)) {
    // # str() at line
    const text = brokenText[lineId];

    // # parse title
    if (lineId == 0) {
      parsedList.push({
        format: Format.SectionHeader,
        lineId,
        text,
      });
    }

    // # parse linebreak
    else if (text.replace(" ", "").length == 0) {
      parsedList.push({
        format: Format.LineBreak,
        lineId,
        text,
      });
    }

    // # parse esv watermark (removed)
    else if (text == " (ESV)") {
    }

    // # parse footnote
    else if (text[0].includes("(") && text.slice(0, 4).includes(")")) {
      parsedList.push({
        format: Format.FootnoteText,
        lineId,
        text,
      });
    }

    // # parse header
    else {
      const hasLineBreakBefore =
        brokenText[lineId - 1].replace(" ", "").length == 0;
      const hasLineBreakAfter =
        brokenText[lineId + 1].replace(" ", "").length == 0;
      const isLineLessThanMaxHeaderLength = text.length < max_header_length;
      const doesNotHaveSquareBrackets = text.match(/\[\d+\]/) == null;

      if (
        hasLineBreakBefore && // # linebreak before
        hasLineBreakAfter && // # linebreak after
        isLineLessThanMaxHeaderLength && // # less than maximum header length
        doesNotHaveSquareBrackets // # does not have square brackets
      ) {
        const brokenFootnote = parseInTextNum({
          text,
          lineId,
          numFormat: Format.InlineFootnote,
          subtextFormat: Format.SectionHeader,
          parenthesisType: "()",
        });
        parsedList.push(...brokenFootnote);
      }

      // # parse body text

      // # split verses
      else {
        const brokenVerse = parseInTextNum({
          text,
          lineId,
          numFormat: Format.VerseNumber,
          subtextFormat: Format.StandardText,
          parenthesisType: "[]",
        });

        // # split footnote number
        // # footnote number
        for (const verse of brokenVerse) {
          if (verse["format"] == Format.VerseNumber) {
            parsedList.push(verse);
          }

          // # subverses split by footnote number
          else {
            const brokenFootnote = parseInTextNum({
              text: verse["text"],
              lineId,
              numFormat: Format.InlineFootnote,
              subtextFormat: Format.StandardText,
              parenthesisType: "()",
            });

            parsedList.push(...brokenFootnote);
          }
        }
      }
    }
  }

  const finalList = parsedList.map((item, index) => {
    return { ...item, id: index };
  });

  return finalList;
};

const parseInTextNum = ({
  text,
  lineId,
  numFormat,
  subtextFormat,
  parenthesisType,
}: {
  text: string;
  lineId: number;
  numFormat: Format;
  subtextFormat: Format;
  parenthesisType: string;
}) => {
  const parsedList = []; // # init output list
  let brokenText = [];

  // # "()"
  if (parenthesisType == "()") {
    brokenText = text.split(/\(([0-9_]+)\)/);
  }
  // # "[]"
  else {
    brokenText = text.split(/\[([0-9_]+)\]/);
  }

  // # number
  for (const text of brokenText) {
    if (!isNaN(parseInt(text))) {
      parsedList.push({
        format: numFormat,
        lineId,
        text,
      });
    }

    // # subtext
    else {
      parsedList.push({
        format: subtextFormat,
        lineId,
        text,
      });
    }
  }

  return parsedList;
};

export { useTexts, TextsProvider, parseTexts };
