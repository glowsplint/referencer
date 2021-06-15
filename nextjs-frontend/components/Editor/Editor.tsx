import React, { useState } from "react";
import Autocomplete from "@material-ui/lab/Autocomplete";
import InputAdornment from "@material-ui/core/InputAdornment";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import { grey } from "@material-ui/core/colors";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import { makeStyles } from "@material-ui/core";
import styles from "./Editor.module.css";
import { get } from "../utils";
import books from "../books";
import clsx from "clsx";
import { Scrollbars } from "react-custom-scrollbars";
import { Format } from "../../enums/enums";
import { DisplayedBody, useTexts } from "../../contexts/Texts";
import { REGEX, COLOURS, ColourType } from "../../enums/enums";
import { useHighlight } from "../../contexts/Highlight";

import HelpIcon from "@material-ui/icons/Help";
import SearchIcon from "@material-ui/icons/Search";

const useStyles = makeStyles({
  root: (props: { colour: string }) => ({
    backgroundColor: COLOURS[props.colour],
  }),
});

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

const Italics = ({ phrase }: { phrase: string }) => {
  return <i>{phrase}</i>;
};

const HighlightedText = ({
  phrase,
  colour,
  dataIndex,
}: {
  phrase: string;
  colour: ColourType;
  dataIndex: string;
}) => {
  const classes = useStyles({ colour: colour });
  return (
    <span className={clsx(classes.root, styles.span)} data-index={dataIndex}>
      {phrase}
    </span>
  );
};

const NormalText = ({
  phrase,
  dataIndex,
}: {
  phrase: string;
  dataIndex: string;
}) => {
  return (
    <span className={styles.span} data-index={dataIndex}>
      {phrase}
    </span>
  );
};

const HighlightDecider = ({
  phrase,
  dataIndex,
}: {
  phrase: string;
  dataIndex: string;
}) => {
  // Splits the phrase into highlighted, italicised and normal text
  const { highlightIndices } = useHighlight();

  // Get the colors coresponding to the verse
  let phraseIndices  = new Map<string, [number, number][]>();
  let colorPtrs = new Map<string, number>();
  let splits : number[] = [0];
  for (let col in highlightIndices) {
    if (dataIndex in highlightIndices[col]) {
      phraseIndices.set(col, highlightIndices[col][dataIndex]);
      colorPtrs.set(col, 0);
      for (let interval of highlightIndices[col][dataIndex]) {
        splits.push(...interval);
      }
    }
  }
  splits.push(phrase.length);
  splits.sort((a, b) => { return a - b; });
  type Subphrase = {st : number, en : number, colour? : ColourType};

  let results : Subphrase[] = [];
  for (let i = 0; i < splits.length - 1; i++) {
    if (splits[i] == splits[i + 1]) continue;
    let sphr : Subphrase = {
      st: splits[i], en: splits[i + 1]
    }
    for (let col of phraseIndices.keys()) {
      let i = colorPtrs.get(col);
      if (i < phraseIndices.get(col).length) {
        let [stH, enH] = phraseIndices.get(col)[(colorPtrs.get(col))];
        if (stH == sphr.st) {
          // Found the color.
          sphr['colour'] = col as ColourType;
          colorPtrs.set(col, colorPtrs.get(col) + 1);
          break;
        }
      }
    }
    results.push(sphr);
  }

  if (results.length > 1) {console.log(results);}

  return (
    <>
      {results.map((sphr : Subphrase, index) => {
        if (sphr.hasOwnProperty('colour')) {
          return (
            <HighlightedText
              phrase={phrase.substr(sphr.st, sphr.en-sphr.st)}
              colour={sphr.colour}
              dataIndex={dataIndex}
              key={index}
            />
          );
        } else {
          return (
            <NormalText
            phrase={phrase.substr(sphr.st, sphr.en-sphr.st)}
            dataIndex={dataIndex}
            key={index}
            />
          );
        }
      })}
    </>
  );
};

const InlineFootnote = ({
  text,
  dataIndex,
}: {
  text: string;
  dataIndex: string;
}) => {
  return (
    <Typography variant="overline">
      <sup>{text}</sup>
    </Typography>
  );
};

const FootnoteDecider = ({
  text,
  textAreaID,
}: {
  text: string;
  textAreaID: string;
}) => {
  const { displayedTexts } = useTexts();
  const { highlightIndices } = useHighlight();

  // Splits the text into several chunks comprising:
  // 1. Normal text to be rendered
  // 2. Inline footnotes to be italicised
  // Dispatches to their respective component for rendering

  // First, we check if {text} is mentioned in HighlightContext
  // If yes, then for every tuple in the values, we mark it as highlighted
  // If no, then we skip completely
  const getPosition = (text: string, textAreaID: string) =>
    displayedTexts.bodies[textAreaID].brokenText.indexOf(text);

  const matches = text.matchAll(REGEX.inlineFootnote);
  for (const match of matches) {
    console.log(
      `Found ${match} with indices [${match.index}, ${
        match.index + match[0].length
      }]`
    );
  }

  const charArray = text.split(REGEX.inlineFootnote);

  return (
    <>
      {charArray.map((item, index) => {
        if (item.match(REGEX.inlineFootnote)) {
          return (
            <InlineFootnote
              text={item}
              key={index}
              dataIndex={getPosition(text, textAreaID)}
            />
          );
        }
        return (
          <HighlightDecider
            phrase={item}
            key={index}
            dataIndex={getPosition(text, textAreaID)}
          />
        );
      })}
    </>
  );
};

const SectionHeader = ({
  text,
  textAreaID,
}: {
  text: string;
  textAreaID: string;
}) => {
  return (
    <div className={styles.section_header}>
      <b>
        <FootnoteDecider text={text} textAreaID={textAreaID} />
      </b>
    </div>
  );
};

const SpecialNote = ({
  text,
  textAreaID,
}: {
  text: string;
  textAreaID: string;
}) => {
  // Matches special notes in John 7 and Mark 16
  return (
    <div className={styles.special_note}>
      <FootnoteDecider text={text} textAreaID={textAreaID} />
    </div>
  );
};

const ItalicsBlock = ({
  text,
  dataIndex,
}: {
  text: string;
  dataIndex: string;
}) => {
  // Removes the asterisks on the ends before rendering
  const textWithoutAsterisks = text.slice(1, text.length - 1);
  return <i data-index={dataIndex}>{textWithoutAsterisks}</i>;
};

const VerseNumber = ({
  text,
  textAreaID,
}: {
  text: string;
  textAreaID: string;
}) => {
  const { displayedTexts } = useTexts();
  const getPosition = (text: string, textAreaID: string) =>
    displayedTexts.bodies[textAreaID].brokenText.indexOf(text);
  return (
    <Typography
      variant="button"
      className={styles.verseNumber}
      data-index={getPosition(text, textAreaID)}
    >
      <b>
        <sup>{text}</sup>
      </b>
    </Typography>
  );
};

const FootnoteText = ({
  text,
  dataIndex,
}: {
  text: string;
  dataIndex: string;
}) => {
  // Splits the text into several chunks comprising:
  // 1. Words to be italicised
  // 2. Words in standard formatting
  // Dispatches to their respective component for rendering
  return (
    <div className={styles.footnote_text}>
      {text
        .split(REGEX.italics)
        .map((text, index) =>
          text.match(REGEX.italics) ? (
            <ItalicsBlock text={text} key={index} dataIndex={dataIndex} />
          ) : (
            text
          )
        )}
    </div>
  );
};

const Quotes = ({ text, textAreaID }: { text: string; textAreaID: string }) => {
  // Adds a new paragraph before the start of a quote
  return (
    <>
      <ParagraphSpacer />
      <FootnoteDecider text={text.slice(2)} textAreaID={textAreaID} />
    </>
  );
};

const ParagraphSpacer = () => <SectionHeader text="" textAreaID="" />;

const Psalm426 = ({
  text,
  textAreaID,
}: {
  text: string;
  textAreaID: string;
}) => {
  // Special handling for Psalm 42:6
  // The parsing engine assumes that text appearing after text should be formatted as a SectionHeader
  // This is a special case hardcoded as an exception.
  return (
    <>
      <ParagraphSpacer />
      <FootnoteDecider text={text} textAreaID={textAreaID} />
    </>
  );
};

const TextArea = React.memo(
  ({
    textName,
    textBody,
    isJustified,
    id,
  }: {
    textName: string;
    textBody: DisplayedBody;
    isJustified: boolean;
    id: number;
  }) => {
    const { brokenText, brokenFootnotes, formatMainText, formatFootnotes } =
      textBody;

    const getComponent = (
      format: string,
      text: string,
      index: number,
      id: string
    ) => {
      const componentMap = {
        [Format.SectionHeader]: React.createElement(SectionHeader, {
          text: text,
          key: index,
          textAreaID: id,
        }),
        [Format.VerseNumber]: React.createElement(VerseNumber, {
          text: text,
          key: index,
          textAreaID: id,
        }),
        [Format.SpecialNote]: React.createElement(SpecialNote, {
          text: text,
          key: index,
          textAreaID: id,
        }),
        [Format.Quotes]: React.createElement(Quotes, {
          text: text,
          key: index,
          textAreaID: id,
        }),
        [Format.StandardText]: React.createElement(FootnoteDecider, {
          text: text,
          key: index,
          textAreaID: id,
        }),
        [Format.HasTripleLineFeedAtEnd]: React.createElement(ParagraphSpacer, {
          key: index,
          textAreaID: id,
        }),
        [Format.Psalm426]: React.createElement(Psalm426, {
          text: text,
          key: index,
          textAreaID: id,
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
        id={id.toString()}
      >
        <Typography variant="h6">{textName}</Typography>
        {brokenText.map((textArray, index: number) =>
          getComponent(formatMainText[index], textArray, index, id.toString())
        )}
        {brokenFootnotes.map((text, index: number) => {
          if (formatFootnotes[index] === Format.SectionHeader) {
            return (
              <SectionHeader
                text={text}
                key={index}
                textAreaID={id.toString()}
              />
            );
          } else {
            return (
              <FootnoteText text={text} key={index} dataIndex={id.toString()} />
            );
          }
        })}
      </div>
    );
  }
);

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
            id={index}
          />
        ))}
      </div>
    </Scrollbars>
  );
};

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
