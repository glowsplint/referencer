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
  hasLineFeed: /(^\n[ ]*$)/,
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

enum Format {
  SectionHeader = "SectionHeader",
  VerseNumber = "VerseNumber",
  StandardText = "StandardText",
  Quotes = "Quotes",
  SpecialNote = "SpecialNote",
  HasLineFeed = "HasLineFeed",
  FootnoteText = "FootnoteText",
  Psalm426 = "Psalm426",
  hasTripleLineFeedAtEnd = "hasTripleLineFeedAtEnd",
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

const Italics = ({ word }: { word: string }) => {
  return <i>{word}</i>;
};

const Highlightable = ({ word }: { word: string }) => {
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
      <span className={clsx(styles.highlightable, styles.span)}>
        {item(word)}
      </span>
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

const Decider = ({ text }: { text: string }) => {
  const charArray = text.split(regex.inlineFootnote);

  const logic = (text: string, index: number) => {
    if (text.match(regex.inlineFootnote)) {
      return <InlineFootnote text={text} key={index} />;
    }
    return (
      <>
        <Highlightable word={text} key={index} />
      </>
    );
  };
  return <>{charArray.map((text, index) => logic(text, index))}</>;
};

const StandardText = ({ text }: { text: string }) => {
  return <>{<Decider text={text} />}</>;
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
  return (
    <>
      <ParagraphSpacer text={""} />
      <StandardText text={text.slice(4)} />
    </>
  );
};

const ParagraphSpacer = ({ text }: { text: string }) => {
  return (
    <>
      <SectionHeader text={""} />
    </>
  );
};

const HasLineFeed = () => {
  return <br />;
};

const Psalm426 = ({ text }: { text: string }) => {
  return (
    <>
      <ParagraphSpacer text={""} />
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

    const getFormatMainText = (mainText: string[]): [string[], string[]] => {
      const brokenText = mainText.slice(1).flatMap((a) =>
        a
          .split(regex.verseNumberInText)
          .flatMap((b) => b.split(regex.specialNoteInText))
          .flatMap((d) => d.split(regex.hasTripleLineFeed))
          .flatMap((f) => f.split(regex.hasTripleLineFeedAtEnd))
      );
      let format: string[] = [];
      let firstVerseNumberFound: boolean = false;

      const addSpace = (brokenTextIndex: string): string => {
        if (brokenTextIndex !== "" && !brokenTextIndex.endsWith("\n")) {
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
          } else if (item.match(regex.hasTripleLineFeedAtEnd)) {
            format[index] = Format.hasTripleLineFeedAtEnd;
          } else if (item.match(regex.hasLineFeed)) {
            format[index] = Format.HasLineFeed;
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
      let format: string[] = Array(footnotes.length).fill(Format.FootnoteText);
      format[0] = Format.SectionHeader;
      return [format, footnotes];
    };

    let [mainText, footnotes] = splitTexts(textBody[0]);
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
        [Format.HasLineFeed]: React.createElement(HasLineFeed, {
          text: text,
          key: index,
        }),
        [Format.hasTripleLineFeedAtEnd]: React.createElement(ParagraphSpacer, {
          text: text,
          key: index,
        }),
        [Format.Psalm426]: React.createElement(Psalm426, {
          text: text,
          key: index,
        }),
      };
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
