import React, { useState } from "react";
import Autocomplete from "@material-ui/lab/Autocomplete";
import InputAdornment from "@material-ui/core/InputAdornment";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import { grey } from "@material-ui/core/colors";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import styles from "../styles/Editor.module.css";
import { get } from "./helperFunctions";
import books from "./books";
import clsx from "clsx";

import DesktopWindowsIcon from "@material-ui/icons/DesktopWindows";
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

function SearchBar({
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
}) {
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
}

function Whitespace() {
  return <span className={styles.span}> </span>;
}

function Italics({ word }: { word: string }) {
  return <i>{word}</i>;
}

function Highlightable({ word }: { word: string }) {
  const [hoverClass, setHoverClass] = useState(styles.highlightable);
  const item = (word: string) => {
    if (word === "Higgaion." || word === "Selah") {
      return <Italics word={word} />;
    }
    return word;
  };

  return (
    <span
      className={hoverClass}
      onMouseOver={() =>
        setHoverClass(clsx(styles.highlightable, styles.highlighted))
      }
      onMouseLeave={() => setHoverClass(styles.highlightable)}
    >
      {item(word)}
    </span>
  );
}

function InlineFootnote({ word }: { word: string }) {
  return (
    <Typography variant="overline">
      <sup>{word}</sup>
    </Typography>
  );
}

function Decider({ word }: { word: string }) {
  const whitespaceIndex = word.search(/\S|$/);
  const indents = word.slice(0, whitespaceIndex);
  const characters = word.slice(whitespaceIndex);
  const logic = () => {
    if (word.match(regex.whitespace)) {
      return <Whitespace />;
    } else if (word.match(regex.inlineFootnote)) {
      return <InlineFootnote word={word} />;
    }
    return (
      <>
        <Indent whitespace={indents} />
        <Highlightable word={characters} />
      </>
    );
  };
  return <>{logic()}</>;
}

function Indent({ whitespace }: { whitespace: string }) {
  return (
    <>
      {[...Array(whitespace.length).keys()].map((_, index) => (
        <Whitespace key={index} />
      ))}
    </>
  );
}

function StandardText({ text }: { text: string }) {
  return (
    <>
      {text
        .split(regex.inlineFootnote)
        .flatMap((a) => a.split(regex.whitespaceAfterWord))
        .filter(Boolean)
        .map((word, index) => (
          <Decider word={word} key={index} />
        ))}
    </>
  );
}

function SectionHeader({ text }: { text: string }) {
  return (
    <div className={styles.section_header}>
      <b>
        <StandardText text={text} />
      </b>
    </div>
  );
}

function SpecialNote({ text }: { text: string }) {
  const [textInSquareBrackets, footnote] = text
    .split(regex.specialNote)
    .slice(1);
  return (
    <div className={styles.special_note}>
      <StandardText text={textInSquareBrackets} />
      <InlineFootnote word={footnote} />
    </div>
  );
}

function ItalicsBlock({ text }: { text: string }) {
  const textWithoutAsterisks = text.slice(1, text.length - 1);
  return (
    <i>
      <StandardText text={textWithoutAsterisks} />
    </i>
  );
}

function VerseNumber({ text }: { text: string }) {
  return (
    <Typography variant="button">
      <b>
        <sup>{text}</sup>
      </b>
    </Typography>
  );
}

function FootnoteText({ text }: { text: string }) {
  return (
    <div>
      {text
        .split(regex.italics)
        .map((text, index) =>
          text.match(regex.italics) ? (
            <ItalicsBlock text={text} key={index} />
          ) : (
            <StandardText text={text} key={index} />
          )
        )}
    </div>
  );
}

function Quotes({ text }: { text: string }) {
  return (
    <>
      <HasLineFeed />
      <HasLineFeed />
      <StandardText text={text.slice(2)} />
    </>
  );
}

function HasLineFeed() {
  return <br />;
}

function Psalm426({ text }: { text: string }) {
  return (
    <>
      <HasLineFeed />
      <HasLineFeed />
      <StandardText text={text} />
    </>
  );
}

function TextArea({
  textName,
  textBody,
  isJustified,
}: {
  textName: string;
  textBody: string[];
  isJustified: boolean;
}) {
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

  const getFormatMainText = (mainText: string[]) => {
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
    // Everything before the first verse number is found is a section header.
    // After that, if you find text after text (as opposed to text after versenumber), then the 2nd text is also a section header.
    // If it's not a special case, then it is just text.
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
            brokenText[index] = addSpace(brokenText[index]);
          } else if (mainText[0].match(regex.isPsalm)) {
            format[index] = Format.StandardText;
            brokenText[index] = addSpace(brokenText[index]);
          } else {
            format[index] = Format.Quotes;
          }
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
      [Format.Quotes]: React.createElement(Quotes, { text: text, key: index }),
      [Format.StandardText]: React.createElement(StandardText, {
        text: text,
        key: index,
      }),
      [Format.HasLineFeed]: React.createElement(HasLineFeed, {
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
      {brokenText.map((text, index) =>
        getComponent(formatMainText[index], text, index)
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

function HeaderLeft() {
  return (
    <div className={styles.editor_header_left}>
      <DesktopWindowsIcon />
      <div className={styles.header_left_text}>
        <Typography variant="subtitle2">Your Workspace</Typography>
      </div>
    </div>
  );
}

function HeaderRight() {
  return (
    <div className={styles.editor_header_right}>
      <Tooltip title="Help" placement="left">
        <IconButton size="small" onClick={() => {}}>
          <HelpIcon />
        </IconButton>
      </Tooltip>
    </div>
  );
}

export default function Editor({
  textHeaders,
  textBodies,
  handleInputChange,
  handleSubmit,
  searchQuery,
  isMultipleRowsLayout,
  isJustified,
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
}) {
  return (
    <div className={styles.editor}>
      <div className={styles.editor_header}>
        <HeaderLeft />
        <HeaderRight />
      </div>

      <div
        className={
          isMultipleRowsLayout
            ? styles.editor_textareas_row
            : styles.editor_textareas_col
        }
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

      <SearchBar
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        searchQuery={searchQuery}
      />
    </div>
  );
}
