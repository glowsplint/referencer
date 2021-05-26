import styles from "../../styles/Editor.module.css";
import Autocomplete from "@material-ui/lab/Autocomplete";
import InputAdornment from "@material-ui/core/InputAdornment";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import { grey } from "@material-ui/core/colors";
import books from "./text/books";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";

import DesktopWindowsIcon from "@material-ui/icons/DesktopWindows";
import HelpIcon from "@material-ui/icons/Help";
import SearchIcon from "@material-ui/icons/Search";

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

function VerseNumberComponent({ text }: { text: string }) {
  return <Typography variant="button">{text}</Typography>;
}

function SectionHeaderComponent({ text }: { text: string }) {
  return <Typography variant="h6">{text}</Typography>;
}

function InlineFootnoteComponent({ text }: { text: string }) {
  return <sup>{text}</sup>;
}

function StandardTextComponent({ text }: { text: string }) {
  return <span>{text}</span>;
}

function TextArea({
  textName,
  textBody,
}: {
  textName: string;
  textBody: string[];
}) {
  enum Format {
    SectionHeader = "SectionHeader",
    VerseNumber = "VerseNumber",
    InlineFootnote = "InlineFootnote",
    StandardText = "StandardText",
  }

  const removeParagraphs = (text: string): string[] => text.split("\n\n");
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

  const matchVerseNumber = (text: string) => text.match(/^\d+$/);
  const matchInlineFootnote = (text: string) => text.match(/^\(\d+\)$/);

  const splitOnVerseNumbers = (text: string): string[] =>
    text.split(/\[(\d+)\]/);
  const splitOnFootnotes = (text: string): string[] => text.split(/(\(\d+\))/);
  // console.log(footnotes);
  const findFormat = (mainText: string[]) => {
    let brokenText = mainText
      .slice(1)
      .flatMap((a) =>
        splitOnVerseNumbers(a).flatMap((b) => splitOnFootnotes(b))
      );
    let format: string[] = [];
    let firstVerseNumberFound: boolean = false;

    // Everything before the first verse number is found is a section header.
    // After that, if you find text after text (as opposed to text after versenumber), then the 2nd text is also a section header.
    // If it's not a special case, then it is just text.
    for (let [index, item] of brokenText.entries()) {
      if (matchVerseNumber(item) !== null) {
        format[index] = Format.VerseNumber;
        if (!firstVerseNumberFound) {
          firstVerseNumberFound = true;
        }
      } else {
        if (!firstVerseNumberFound) {
          format[index] = Format.SectionHeader;
        } else if (matchInlineFootnote(item) !== null) {
          format[index] = Format.InlineFootnote;
        } else if (format[index - 1] === Format.StandardText) {
          format[index] = Format.SectionHeader;
        } else {
          format[index] = Format.StandardText;
        }
      }
    }
    // console.log(format);
    return [format, brokenText];
  };

  let [mainText, footnotes] = splitTexts(textBody[0]);
  const [format, brokenText] = findFormat(mainText);
  // console.log(brokenText);

  return (
    <div className={styles.editor_textarea}>
      <Typography variant="h6">{textName}</Typography>
      {brokenText.map((text, index) => {
        if (format[index] === Format.SectionHeader) {
          return <SectionHeaderComponent text={text} />;
        } else if (format[index] === Format.VerseNumber) {
          return <VerseNumberComponent text={text} />;
        } else if (format[index] === Format.InlineFootnote) {
          return <InlineFootnoteComponent text={text} />;
        } else {
          return <StandardTextComponent text={text} />;
        }
      })}
      {/* <Typography align="justify">{mainText.join(" ")}</Typography> */}
      {/* <Typography align="justify">{footnotes.join(" ")}</Typography> */}
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
}) {
  const parsePassages = (passages): [string[], string[]] => {
    const removeParagraphs = (text) => text.split("\n\n");
    const splitTexts = (text: string): [string[], string[]] => {
      const footnoteIndex: number = removeParagraphs(text).indexOf("Footnotes");
      let footnotes = [];
      let mainText = removeParagraphs(text);
      if (footnoteIndex !== -1) {
        footnotes = removeParagraphs(text).slice(footnoteIndex);
        mainText = removeParagraphs(text).slice(0, footnoteIndex);
      }
      return [mainText, footnotes];
    };
    return splitTexts(passages[0]);
  };
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
