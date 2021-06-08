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

import HelpIcon from "@material-ui/icons/Help";
import SearchIcon from "@material-ui/icons/Search";

const regex = {
  footnoteInText: /(?<!])(\(\d+\))/,
  specialNoteInText: /^(\[.*?\]\(\d+\))$/,
  verseNumberInText: /[ ]*\[(\d+)\]/,
  hasLineFeed: /(\n)(?:[ ]*$)*/,
  hasLineFeedAtEnd: /(?:\n[ ]{4}){3}/,
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

enum Format {
  SectionHeader = "SectionHeader",
  VerseNumber = "VerseNumber",
  StandardText = "StandardText",
  Quotes = "Quotes",
  SpecialNote = "SpecialNote",
  HasLineFeed = "HasLineFeed",
  FootnoteText = "FootnoteText",
  Psalm426 = "Psalm426",
}

enum Highlight {
  Orange = "Orange",
  Yellow = "Yellow",
  Green = "Green",
  Blue = "Blue",
  Purple = "Purple",
  None = "None",
}

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

const Whitespace = () => {
  return <span className={styles.span}> </span>;
};

const Italics = ({ word }: { word: string }) => {
  return <i>{word}</i>;
};

const Highlightable = ({
  word,
  highlight,
}: {
  word: string;
  highlight: string;
}) => {
  const item = (word: string) => {
    if (word === "Higgaion." || word === "Selah") {
      return <Italics word={word} />;
    }
    return word;
  };

  const nullify = (word: string) => {
    if (word === "") {
      return null;
    }
    return (
      <span
        className={clsx(styles.highlightable, {
          [styles.orange]: highlight === Highlight.Orange,
          [styles.yellow]: highlight === Highlight.Yellow,
          [styles.green]: highlight === Highlight.Green,
          [styles.blue]: highlight === Highlight.Blue,
          [styles.purple]: highlight === Highlight.Purple,
        })}
      >
        {item(word)}
      </span>
    );
  };

  return nullify(word);
};

const InlineFootnote = ({ word }: { word: string }) => {
  return (
    <Typography variant="overline">
      <sup>{word}</sup>
    </Typography>
  );
};

const Decider = ({ word, highlight }: { word: string; highlight: string }) => {
  const whitespaceIndex = word.search(/\S|$/);
  const indents = word.slice(0, whitespaceIndex);
  const characters = word.slice(whitespaceIndex);
  const logic = () => {
    if (word.match(regex.inlineFootnote)) {
      return <InlineFootnote word={word} />;
    }
    return (
      <>
        <Indent whitespace={indents} />
        <Highlightable word={characters} highlight={highlight} />
      </>
    );
  };
  return <>{logic()}</>;
};

const Indent = ({ whitespace }: { whitespace: string }) => {
  return (
    <>
      {[...Array(whitespace.length).keys()].map((_, index) => (
        <Whitespace key={index} />
      ))}
    </>
  );
};

const StandardText = ({
  textArray,
  highlight,
}: {
  textArray: string[];
  highlight: string[];
}) => {
  return (
    <>
      {textArray.map((word, index) => (
        <Decider word={word} key={index} highlight={highlight[index]} />
      ))}
    </>
  );
};

const SectionHeader = ({
  textArray,
  highlight,
}: {
  textArray: string[];
  highlight: string[];
}) => {
  return (
    <div className={styles.section_header}>
      <b>
        <StandardText textArray={textArray} highlight={highlight} />
      </b>
    </div>
  );
};

const SpecialNote = ({
  textArray,
  highlight,
}: {
  textArray: string[];
  highlight: string[];
}) => {
  const [textInSquareBrackets, footnote] = [
    textArray.slice(0, textArray.length - 1),
    textArray.slice(-1),
  ];
  return (
    <div className={styles.special_note}>
      <StandardText textArray={textInSquareBrackets} highlight={highlight} />
      <InlineFootnote word={footnote[0]} />
    </div>
  );
};

const ItalicsBlock = ({ text }: { text: string }) => {
  const textWithoutAsterisks = text.slice(1, text.length - 1);
  return <i>{textWithoutAsterisks}</i>;
};

const VerseNumber = ({ textArray }: { textArray: string[] }) => {
  return (
    <Typography variant="button">
      <b>
        <sup>{textArray}</sup>
      </b>
    </Typography>
  );
};

const FootnoteText = ({ text }: { text: string }) => {
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

const Quotes = ({
  textArray,
  highlight,
}: {
  textArray: string[];
  highlight: string[];
}) => {
  return (
    <>
      <HasLineFeed />
      <HasLineFeed />
      <StandardText textArray={textArray.slice(4)} highlight={highlight} />
    </>
  );
};

const HasLineFeed = () => {
  return <br />;
};

const Psalm426 = ({
  textArray,
  highlight,
}: {
  textArray: string[];
  highlight: string[];
}) => {
  return (
    <>
      <HasLineFeed />
      <HasLineFeed />
      <StandardText textArray={textArray} highlight={highlight} />
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
    textBody: string[];
    isJustified: boolean;
  }) => {
    const removeParagraphs = (text: string): string[] =>
      text.split(regex.paragraphs);

    const splitTexts = (text: string): [string[], string[]] => {
      const footnoteIndex = removeParagraphs(text).indexOf("Footnotes");
      let footnotes = [];
      let mainText = removeParagraphs(text);
      if (footnoteIndex !== -1) {
        footnotes = removeParagraphs(text).slice(footnoteIndex);
        mainText = removeParagraphs(text).slice(0, footnoteIndex);
      }
      return [mainText, footnotes];
    };

    const getFormatMainText = (mainText: string[]): [string[], string[][]] => {
      const brokenText = mainText.slice(1).flatMap((a) =>
        a
          .split(regex.verseNumberInText)
          .flatMap((b) => b.split(regex.specialNoteInText))
          .flatMap((d) => d.split(regex.hasLineFeedAtEnd))
          .flatMap((e) => e.split(regex.hasLineFeed))
      );
      let format: string[] = [];
      let firstVerseNumberFound: boolean = false;

      const addSpace = (brokenTextIndex: string): string => {
        if (brokenTextIndex !== "") {
          return brokenTextIndex + " ";
        }
        return brokenTextIndex;
      };

      for (let [index, item] of brokenText.entries()) {
        if (item.match(regex.verseNumber)) {
          format[index] = Format.VerseNumber;
          if (!firstVerseNumberFound) {
            firstVerseNumberFound = true;
          }
        } else {
          if (!firstVerseNumberFound) {
            format[index] = Format.SectionHeader;
          } else if (item.match(regex.specialNoteInText)) {
            format[index] = Format.SpecialNote;
          } else if (item.match(regex.quotes)) {
            if (format[index - 1] === Format.VerseNumber) {
              format[index] = Format.StandardText;
            } else if (mainText[0].match(regex.isPsalm)) {
              format[index] = Format.StandardText;
            } else {
              format[index] = Format.Quotes;
            }
            brokenText[index] = addSpace(brokenText[index]);
          } else if (item.match(regex.hasLineFeed)) {
            format[index] = Format.HasLineFeed;
          } else if (format[index - 1] === Format.StandardText) {
            if (item.endsWith(";")) {
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

      return [
        format,
        brokenText.map((item, index) =>
          item
            .split(regex.inlineFootnote)
            .flatMap((a) => a.split(regex.whitespaceAfterWord))
        ),
      ];
    };

    const getFormatFootnotes = (footnotes: string[]) => {
      let format: string[] = Array(footnotes.length).fill(Format.FootnoteText);
      format[0] = Format.SectionHeader;
      return [format, footnotes];
    };

    let [mainText, footnotes] = splitTexts(textBody[0]);
    const [formatMainText, brokenText] = getFormatMainText(mainText);
    const [formatFootnotes, brokenFootnotes] = getFormatFootnotes(footnotes);

    const getComponent = (
      format: string,
      textArray: string[],
      index: number,
      highlights: string[][]
    ) => {
      const componentMap = {
        [Format.SectionHeader]: React.createElement(SectionHeader, {
          textArray: textArray,
          key: index,
          highlight: highlights[index],
        }),
        [Format.VerseNumber]: React.createElement(VerseNumber, {
          textArray: textArray,
          key: index,
        }),
        [Format.SpecialNote]: React.createElement(SpecialNote, {
          textArray: textArray,
          key: index,
          highlight: highlights[index],
        }),
        [Format.Quotes]: React.createElement(Quotes, {
          textArray: textArray,
          key: index,
          highlight: highlights[index],
        }),
        [Format.StandardText]: React.createElement(StandardText, {
          textArray: textArray,
          key: index,
          highlight: highlights[index],
        }),
        [Format.HasLineFeed]: React.createElement(HasLineFeed, {
          textArray: textArray,
          key: index,
        }),
        [Format.Psalm426]: React.createElement(Psalm426, {
          textArray: textArray,
          key: index,
          highlight: highlights[index],
        }),
      };
      return get(componentMap, format, componentMap[Format.StandardText]);
    };

    let highlights = Array(brokenText.length);
    for (let [index, value] of highlights.entries()) {
      highlights[index] = Array(brokenText[index].length).fill(Highlight.None);
    }
    highlights[0][0] = Highlight.Yellow;
    highlights[0][2] = Highlight.Green;

    return (
      <div
        className={clsx(styles.editor_textarea, {
          [styles.justify]: isJustified,
          [""]: !isJustified,
        })}
      >
        <Typography variant="h6">{textName}</Typography>
        {brokenText.map((textArray, index) =>
          getComponent(formatMainText[index], textArray, index, highlights)
        )}
        {brokenFootnotes.map((text, index) => {
          if (formatFootnotes[index] === Format.SectionHeader) {
            return (
              <SectionHeader
                textArray={text.split(regex.whitespaceAfterWord)}
                key={index}
                highlight={Array(brokenFootnotes.length).fill(Highlight.None)}
              />
            );
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

const MainRegion = React.memo(
  ({
    isMultipleRowsLayout,
    textHeaders,
    textBodies,
    isJustified,
    isDarkMode,
  }: {
    textHeaders: string[];
    textBodies: string[][];
    isMultipleRowsLayout: boolean;
    isJustified: boolean;
    isDarkMode: boolean;
  }) => {
    return (
      <Scrollbars
        style={{ width: "100%", height: "100%" }}
        universal
        renderThumbVertical={({ style, ...props }) => (
          <div
            {...props}
            style={
              isDarkMode
                ? {
                    ...style,
                    backgroundColor: "rgba(256, 256, 256, 0.2)",
                    borderRadius: "inherit",
                  }
                : {
                    ...style,
                    backgroundColor: "rgba(0, 0, 0, 0.2)",
                    borderRadius: "inherit",
                  }
            }
          />
        )}
      >
        <div
          className={clsx(styles.editor_textareas, {
            [styles.row]: isMultipleRowsLayout,
            [styles.col]: !isMultipleRowsLayout,
          })}
        >
          {textHeaders.map((textHeader: string, index: number) => (
            <TextArea
              textName={textHeader}
              textBody={textBodies[index]}
              isJustified={isJustified}
              key={index}
            />
          ))}
        </div>
      </Scrollbars>
    );
  }
);

export default React.memo(
  ({
    textHeaders,
    textBodies,
    handleInputChange,
    handleSubmit,
    searchQuery,
    isMultipleRowsLayout,
    isJustified,
    isDarkMode,
  }: {
    textHeaders: string[];
    textBodies: string[][];
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
          textHeaders={textHeaders}
          textBodies={textBodies}
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
