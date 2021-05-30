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
  hasLineFeed: /(\n)(?:\s*$)*/,
  hasLineFeedAtEnd: /(?:\n\s+){3}$/,
  inlineFootnote: /^\(\d+\)$/,
  italics: /(\*.*?\*)/,
  paragraphs: /\n\n/,
  quotes: /^\s*“.*?$/,
  specialNote: /(\[.*?\])/,
  verseNumber: /^\d+$/,
  whitespace: /^(\s+)$/,
  whitespaceAfterWord: /(?!\B)([.,!?\\-]*)(\s)/,
};

enum Format {
  SectionHeader = "SectionHeader",
  VerseNumber = "VerseNumber",
  InlineFootnote = "InlineFootnote",
  StandardText = "StandardText",
  Quotes = "Quotes",
  SpecialNote = "SpecialNote",
  HasLineFeed = "HasLineFeed",
  FootnoteText = "FootnoteText",
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
  );
}

function Whitespace() {
  return <span className={styles.span}> </span>;
}

function Highlightable({ word }: { word: string }) {
  const [hoverClass, setHoverClass] = useState(styles.highlightable);

  return (
    <span
      className={hoverClass}
      onMouseOver={() =>
        setHoverClass(clsx(styles.highlightable, styles.highlighted))
      }
      onMouseLeave={() => setHoverClass(styles.highlightable)}
    >
      {word}
    </span>
  );
}

function Decider({ word }: { word: string }) {
  const whitespaceIndex = word.search(/\S|$/);
  const indents = word.slice(0, whitespaceIndex);
  const characters = word.slice(whitespaceIndex);
  return (
    <>
      {word.match(regex.whitespace) ? (
        <Whitespace />
      ) : (
        <>
          <Indent whitespace={indents} />
          <Highlightable word={characters} />
        </>
      )}
    </>
  );
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
      {text.split(regex.whitespaceAfterWord).map((word, index) => (
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
  const [textInSquareBrackets, textinParantheses] = text
    .split(regex.specialNote)
    .slice(1);
  return (
    <div className={styles.special_note}>
      <StandardText text={textInSquareBrackets} />
      <InlineFootnote text={textinParantheses} />
    </div>
  );
}

function InlineFootnote({ text }: { text: string }) {
  return (
    <Typography variant="overline">
      <sup>
        <StandardText text={text} />
      </sup>
    </Typography>
  );
}

function Italics({ text }: { text: string }) {
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
            <Italics text={text} key={index} />
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
      <HasLineFeed text="" />
      <HasLineFeed text="" />
      <StandardText text={text.slice(2)} />
    </>
  );
}

function HasLineFeed({ text }: { text: string }) {
  return <br />;
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
        .flatMap((c) => c.split(regex.footnoteInText))
        .flatMap((d) => d.split(regex.hasLineFeedAtEnd))
        .flatMap((e) => e.split(regex.hasLineFeed))
    );
    let format: string[] = [];
    let firstVerseNumberFound: boolean = false;

    // Everything before the first verse number is found is a section header.
    // After that, if you find text after text (as opposed to text after versenumber), then the 2nd text is also a section header.
    // If it's not a special case, then it is just text.
    for (let [index, item] of brokenText.entries()) {
      if (item.match(regex.verseNumber) !== null) {
        format[index] = Format.VerseNumber;
        if (!firstVerseNumberFound) {
          firstVerseNumberFound = true;
        }
      } else {
        if (!firstVerseNumberFound) {
          format[index] = Format.SectionHeader;
        } else if (item.match(regex.specialNoteInText) !== null) {
          format[index] = Format.SpecialNote;
        } else if (item.match(regex.inlineFootnote) !== null) {
          format[index] = Format.InlineFootnote;
          brokenText[index - 1] = brokenText[index - 1].slice(
            0,
            brokenText[index - 1].length - 1
          );
        } else if (item.match(regex.quotes) !== null) {
          if (format[index - 1] === Format.VerseNumber) {
            format[index] = Format.StandardText;
          } else {
            format[index] = Format.Quotes;
          }
        } else if (item.match(regex.hasLineFeed) !== null) {
          format[index] = Format.HasLineFeed;
        } else if (
          format[index - 1] === Format.StandardText ||
          (format[index - 4] === Format.SpecialNote &&
            item.match(regex.whitespace) === null)
        ) {
          format[index] = Format.SectionHeader;
        } else {
          format[index] = Format.StandardText;
          if (brokenText[index] !== "") {
            brokenText[index] = brokenText[index] + " ";
          }
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
      [Format.InlineFootnote]: React.createElement(InlineFootnote, {
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
        <div className={styles.editor_header_left}>
          <DesktopWindowsIcon />
          <div className={styles.header_left_text}>
            <Typography variant="subtitle2">Your Workspace</Typography>
          </div>
        </div>

        <div className={styles.editor_header_right}>
          <Tooltip title="Help" placement="left">
            <IconButton size="small" onClick={() => {}}>
              <HelpIcon />
            </IconButton>
          </Tooltip>
        </div>
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

      <div className={styles.editor_search}>
        <SearchBar
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          searchQuery={searchQuery}
        />
      </div>
    </div>
  );
}
