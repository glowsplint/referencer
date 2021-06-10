import React, { useState } from "react";
import Autocomplete from "@material-ui/lab/Autocomplete";
import InputAdornment from "@material-ui/core/InputAdornment";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import { grey } from "@material-ui/core/colors";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import styles from "./Editor.module.css";
import { get } from "../utils";
import books from "../books";
import clsx from "clsx";
import { Scrollbars } from "react-custom-scrollbars";
import { Highlight, Format } from "../../enums/enums";
import { useTexts } from "../../contexts/Texts";

import HelpIcon from "@material-ui/icons/Help";
import SearchIcon from "@material-ui/icons/Search";

const regex = {
  footnoteInText: /(?<!])(\(\d+\))/,
  specialNoteInText: /^(\[.*?\]\(\d+\))$/,
  verseNumberInText: /[ ]*\[(\d+)\]/,
  hasTripleLineFeed: /(?:\n[ ]{4}){3}/,
  hasTripleLineFeedAtEnd: /((?:\n[ ]{4}){2}\n)/,
  inlineFootnote: /(\(\d+\))/,
  italics: /(\*.*?\*)/,
  paragraphs: /\n\n/,
  quotes: /^[ ]*“.*?$/,
  specialNote: /(\[.*?\])/,
  verseNumber: /^\d+$/,
  whitespace: /^([ ]+)$/,
  whitespaceAfterWord: /([ ])/,
  isPsalm: /^(Psalm)/,
};

const SearchBar = ({
  handleInputChange,
  handleSubmit,
  searchQuery,
}: {
  handleInputChange: (
    _event: React.ChangeEvent<HTMLInputElement>,
    newValue: string
  ) => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  searchQuery: string;
}) => {
  return (
    <div className={styles.editor_search}>
      <form className={styles.container} onSubmit={handleSubmit}>
        <Autocomplete
          id="autocomplete"
          freeSolo
          fullWidth
          options={books}
          inputValue={searchQuery}
          onInputChange={handleInputChange}
          renderInput={(params) => (
            <TextField
              {...params}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon style={{ color: grey[500] }} />
                  </InputAdornment>
                ),
              }}
              label="Search"
              size="small"
              margin="none"
              variant="outlined"
            />
          )}
        />
      </form>
    </div>
  );
};

const Italics = ({ word }: { word: string }) => {
  return <i>{word}</i>;
};

const Word = ({ word }: { word: string }) => {
  // Italicises the word if it is one of the special words from Psalms
  // If not, simply returns the original word
  const italicise = (word: string) => {
    if (word === "Higgaion." || word === "Selah") {
      return <Italics word={word} />;
    }
    return word;
  };

  // Will not render a component if empty string
  const nullify = (word: string) => {
    if (word === "") {
      return null;
    }
    return (
      <span className={clsx(styles.word, styles.span)}>{italicise(word)}</span>
    );
  };

  return nullify(word);
};

const InlineFootnote = ({ text }: { text: string }) => {
  return (
    <Typography variant="overline">
      <sup>{text}</sup>
    </Typography>
  );
};

const StandardText = ({ text }: { text: string }) => {
  // Splits the text into several chunks comprising:
  // 1. Normal text to be rendered
  // 2. Inline footnotes to be italicised
  // Dispatches to their respective component for rendering
  console.log(text);
  const charArray = text.split(regex.inlineFootnote);
  return (
    <>
      {charArray.map((text, index) => {
        if (text.match(regex.inlineFootnote)) {
          return <InlineFootnote text={text} key={index} />;
        }
        return <Word word={text} key={index} />;
      })}
    </>
  );
};

const SectionHeader = ({ text }: { text: string }) => {
  return (
    <div className={styles.section_header}>
      <b>
        <StandardText text={text} />
      </b>
    </div>
  );
};

const SpecialNote = ({ text }: { text: string }) => {
  // Matches special notes in John 7 and Mark 16
  const textArray = text.split(regex.inlineFootnote);
  const [textInSquareBrackets, footnote] = [textArray[0], textArray[1]];
  return (
    <div className={styles.special_note}>
      <StandardText text={textInSquareBrackets} />
      <InlineFootnote text={footnote} />
    </div>
  );
};

const ItalicsBlock = ({ text }: { text: string }) => {
  // Removes the asterisks on the ends before rendering
  const textWithoutAsterisks = text.slice(1, text.length - 1);
  return <i>{textWithoutAsterisks}</i>;
};

const VerseNumber = ({ text }: { text: string }) => {
  return (
    <Typography variant="button">
      <b>
        <sup>{text}</sup>
      </b>
    </Typography>
  );
};

const FootnoteText = ({ text }: { text: string }) => {
  // Splits the text into several chunks comprising:
  // 1. Words to be italicised
  // 2. Words in standard formatting
  // Dispatches to their respective component for rendering
  return (
    <div className={styles.footnote_text}>
      {text
        .split(regex.italics)
        .map((text, index) =>
          text.match(regex.italics) ? (
            <ItalicsBlock text={text} key={index} />
          ) : (
            text
          )
        )}
    </div>
  );
};

const Quotes = ({ text }: { text: string }) => {
  // Adds a new paragraph before the start of a quote
  return (
    <>
      <ParagraphSpacer />
      <StandardText text={text.slice(4)} />
    </>
  );
};

const ParagraphSpacer = () => <SectionHeader text="" />;

const Psalm426 = ({ text }: { text: string }) => {
  // Special handling for Psalm 42:6
  // The parsing engine assumes that text appearing after text should be formatted as a SectionHeader
  // This is a special case hardcoded as an exception.
  return (
    <>
      <ParagraphSpacer />
      <StandardText text={text} />
    </>
  );
};

const TextArea = React.memo(
  ({
    textName,
    textBody,
    isJustified,
  }: {
    textName: string;
    textBody: string;
    isJustified: boolean;
  }) => {
    const splitOnParagraphs = (text: string): string[] =>
      text.split(regex.paragraphs);

    const splitTexts = (text: string): [string[], string[]] => {
      // Splits the original string into the main body of text, and also footnotes
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
          .split(regex.verseNumberInText)
          .flatMap((b) => b.split(regex.specialNoteInText))
          .flatMap((c) => c.split(regex.hasTripleLineFeed))
          .flatMap((d) => d.split(regex.hasTripleLineFeedAtEnd))
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
        if (item.match(regex.verseNumber)) {
          format[index] = Format.VerseNumber;
          if (!firstVerseNumberFound) {
            firstVerseNumberFound = true;
          }
        } else {
          // Everything before the first verse number is found is a SectionHeader
          // firstVerseNumberFound is a flag to track that
          if (!firstVerseNumberFound) {
            format[index] = Format.SectionHeader;
          } else if (item.match(regex.specialNoteInText)) {
            format[index] = Format.SpecialNote;
          } else if (item.match(regex.quotes)) {
            // If the quote (") begins at the start of the verse, format as StandardText
            // or, if the quote (") is in Psalms, format as StandardText
            if (
              format[index - 1] === Format.VerseNumber ||
              mainText[0].match(regex.isPsalm)
            ) {
              format[index] = Format.StandardText;
            } else {
              format[index] = Format.Quotes;
            }
            brokenText[index] = addSpace(brokenText[index]);
            // Triple Line Feeds at the end of the string are parsed as new paragraphs
          } else if (item.match(regex.hasTripleLineFeedAtEnd)) {
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
      let format: string[] = Array(footnotes.length).fill(Format.FootnoteText);
      format[0] = Format.SectionHeader;
      return [format, footnotes];
    };

    let [mainText, footnotes] = splitTexts(textBody);
    const [formatMainText, brokenText] = getFormatMainText(mainText);
    const [formatFootnotes, brokenFootnotes] = getFormatFootnotes(footnotes);

    const getComponent = (format: string, text: string, index: number) => {
      const componentMap = {
        [Format.SectionHeader]: React.createElement(SectionHeader, {
          text: text,
          key: index,
        }),
        [Format.VerseNumber]: React.createElement(VerseNumber, {
          text: text,
          key: index,
        }),
        [Format.SpecialNote]: React.createElement(SpecialNote, {
          text: text,
          key: index,
        }),
        [Format.Quotes]: React.createElement(Quotes, {
          text: text,
          key: index,
        }),
        [Format.StandardText]: React.createElement(StandardText, {
          text: text,
          key: index,
        }),
        [Format.HasTripleLineFeedAtEnd]: React.createElement(ParagraphSpacer, {
          key: index,
        }),
        [Format.Psalm426]: React.createElement(Psalm426, {
          text: text,
          key: index,
        }),
      };

      // Defaults to StandardText if no matching format found from componentMap
      return get(componentMap, format, componentMap[Format.StandardText]);
    };

    return (
      <div
        className={clsx(styles.editor_textarea, {
          [styles.justify]: isJustified,
          [""]: !isJustified,
        })}
      >
        <Typography variant="h6">{textName}</Typography>
        {brokenText.map((textArray, index) =>
          getComponent(formatMainText[index], textArray, index)
        )}
        {brokenFootnotes.map((text, index) => {
          if (formatFootnotes[index] === Format.SectionHeader) {
            return <SectionHeader text={text} key={index} />;
          } else {
            return <FootnoteText text={text} key={index} />;
          }
        })}
      </div>
    );
  }
);

const HeaderLeft = React.memo(() => {
  return (
    <div className={styles.editor_header_left}>
      <div className={styles.header_left_text}>
        <Typography variant="subtitle2">Workspace</Typography>
      </div>
    </div>
  );
});

const HeaderRight = React.memo(() => {
  return (
    <div className={styles.editor_header_right}>
      <Tooltip title="Help" placement="left">
        <IconButton size="small" onClick={() => {}}>
          <HelpIcon />
        </IconButton>
      </Tooltip>
    </div>
  );
});

const MainRegion = ({
  isMultipleRowsLayout,
  isJustified,
  isDarkMode,
}: {
  isMultipleRowsLayout: boolean;
  isJustified: boolean;
  isDarkMode: boolean;
}) => {
  const { headers, bodies } = useTexts().displayedTexts;

  const dark = (style: any) => {
    return {
      ...style,
      backgroundColor: "rgba(256, 256, 256, 0.2)",
      borderRadius: "inherit",
    };
  };

  const light = (style: any) => {
    return {
      ...style,
      backgroundColor: "rgba(0, 0, 0, 0.2)",
      borderRadius: "inherit",
    };
  };

  const maxWidth = { width: "100%", height: "100%" };

  return (
    <Scrollbars
      style={maxWidth}
      universal
      renderThumbVertical={({ style, ...props }) => (
        <div {...props} style={isDarkMode ? dark(style) : light(style)} />
      )}
    >
      <div
        className={clsx(styles.editor_textareas, {
          [styles.row]: isMultipleRowsLayout,
          [styles.col]: !isMultipleRowsLayout,
        })}
      >
        {headers.map((textHeader: string, index: number) => (
          <TextArea
            textName={textHeader}
            textBody={bodies[index]}
            isJustified={isJustified}
            key={index}
          />
        ))}
      </div>
    </Scrollbars>
  );
};

export default React.memo(
  ({
    handleInputChange,
    handleSubmit,
    searchQuery,
    isMultipleRowsLayout,
    isJustified,
    isDarkMode,
  }: {
    handleInputChange: (
      _event: React.ChangeEvent<HTMLInputElement>,
      newValue: string
    ) => void;
    handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    searchQuery: string;
    isMultipleRowsLayout: boolean;
    isJustified: boolean;
    isDarkMode: boolean;
  }) => {
    return (
      <div className={styles.editor}>
        <div className={styles.editor_header}>
          <HeaderLeft />
          <HeaderRight />
        </div>

        <MainRegion
          isMultipleRowsLayout={isMultipleRowsLayout}
          isJustified={isJustified}
          isDarkMode={isDarkMode}
        />
        <SearchBar
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          searchQuery={searchQuery}
        />
      </div>
    );
  }
);
