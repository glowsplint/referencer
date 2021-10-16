import React, { useEffect, useRef, useState } from "react";
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
import { Format } from "../../enums/enums";
import { DisplayedBody, DisplayedTexts, useTexts } from "../../contexts/Texts";
import { REGEX } from "../../enums/enums";
import { Interval } from "../../contexts/Highlight";
import HelpIcon from "@material-ui/icons/Help";
import SearchIcon from "@material-ui/icons/Search";
import dynamic from "next/dynamic";

const NoSSRCanvas = dynamic(() => import("./Canvas"), {
  ssr: false,
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

const Text = ({
  phrase,
  dataIndex,
  dataPosition,
  removeLeadingWhitespace,
}: {
  phrase: string;
  dataIndex: number;
  dataPosition: Interval;
  removeLeadingWhitespace?: boolean;
}) => {
  return (
    <span
      className={clsx(styles.span, {
        [styles.with_leading_whitespace]: !removeLeadingWhitespace,
        [styles.without_leading_whitespace]: removeLeadingWhitespace,
      })}
      data-index={dataIndex}
      data-position={dataPosition}
    >
      {phrase}
    </span>
  );
};

Text.defaultProps = {
  removeLeadingWhitespace: false,
};

const HighlightDecider = ({
  phrase,
  dataIndex,
  dataPosition,
  removeLeadingWhitespace,
}: {
  phrase: string;
  dataIndex: number;
  dataPosition: Interval;
  removeLeadingWhitespace?: boolean;
}) => {
  return (
    <Text
      phrase={phrase}
      dataIndex={dataIndex}
      dataPosition={dataPosition}
      removeLeadingWhitespace={removeLeadingWhitespace}
    />
  );
};

HighlightDecider.defaultProps = {
  removeLeadingWhitespace: false,
};

const InlineFootnote = ({
  text,
  dataIndex,
  dataPosition,
}: {
  text: string;
  dataIndex: number;
  dataPosition: Interval;
}) => {
  return (
    <Typography
      variant="overline"
      data-index={dataIndex}
      data-position={dataPosition}
      className={styles.inline_footnote}
    >
      <sup>{text}</sup>
    </Typography>
  );
};

const getPosition = (
  displayedTexts: DisplayedTexts,
  typeFlag: "mainText" | "footnotes",
  text: string,
  textAreaID: number
) => {
  const body = displayedTexts.bodies[textAreaID][typeFlag];
  return body.indexOf(body.filter((item) => item.text === text)[0]);
};

const FootnoteDecider = ({
  text,
  textAreaID,
  removeLeadingWhitespace,
}: {
  text: string;
  textAreaID: number;
  removeLeadingWhitespace?: boolean;
}) => {
  const { displayedTexts } = useTexts();
  const charArray = text.split(REGEX.inlineFootnote);
  const getDataPosition = (self: string[], index: number): Interval => {
    const getInterval = (index: number) => self.slice(0, index).join("").length;
    return [getInterval(index), getInterval(index + 1)];
  };

  return (
    <>
      {charArray.map((item, index, self) => {
        if (item.match(REGEX.inlineFootnote)) {
          return (
            <InlineFootnote
              text={item}
              key={index}
              dataIndex={getPosition(
                displayedTexts,
                "footnotes",
                text,
                textAreaID
              )}
              dataPosition={getDataPosition(self, index)}
            />
          );
        }
        return (
          <HighlightDecider
            key={index}
            phrase={item}
            dataIndex={getPosition(
              displayedTexts,
              "footnotes",
              text,
              textAreaID
            )}
            dataPosition={getDataPosition(self, index)}
            removeLeadingWhitespace={removeLeadingWhitespace}
          />
        );
      })}
    </>
  );
};

FootnoteDecider.defaultProps = {
  removeLeadingWhitespace: false,
};

const SectionHeader = ({
  text,
  textAreaID,
}: {
  text: string;
  textAreaID: number;
}) => {
  return (
    <div className={styles.section_header}>
      <FootnoteDecider text={text} textAreaID={textAreaID} />
    </div>
  );
};

const SpecialNote = ({
  text,
  textAreaID,
}: {
  text: string;
  textAreaID: number;
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
  dataIndex: number;
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
  textAreaID: number;
}) => {
  const { displayedTexts } = useTexts();
  return (
    <Typography
      variant="button"
      className={styles.verse_number}
      data-index={getPosition(displayedTexts, "mainText", text, textAreaID)}
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
  dataIndex: number;
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

const Quotes = ({ text, textAreaID }: { text: string; textAreaID: number }) => {
  // Adds a new paragraph before the start of a quote
  return (
    <>
      <ParagraphSpacer textAreaID={textAreaID} />
      <FootnoteDecider
        text={text}
        textAreaID={textAreaID}
        removeLeadingWhitespace
      />
    </>
  );
};

const ParagraphSpacer = ({ textAreaID }: { textAreaID: number }) => (
  <SectionHeader text="" textAreaID={textAreaID} />
);

const Psalm426 = ({
  text,
  textAreaID,
}: {
  text: string;
  textAreaID: number;
}) => {
  // Special handling for Psalm 42:6
  // The parsing engine assumes that text appearing after text should be formatted as a SectionHeader
  // This is a special case hardcoded as an exception.
  return (
    <>
      <ParagraphSpacer textAreaID={textAreaID} />
      <FootnoteDecider text={text} textAreaID={textAreaID} />
    </>
  );
};

const TextArea = React.memo(
  ({
    textName,
    textBody,
    isJustified,
    textAreaID,
  }: {
    textName: string;
    textBody: DisplayedBody;
    isJustified: boolean;
    textAreaID: number;
  }) => {
    const { mainText, footnotes } = textBody;

    const getComponent = (
      format: string,
      text: string,
      index: number,
      id: number
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
        id={textAreaID.toString()}
      >
        <Typography variant="h6" className={styles.text_header}>
          {textName}
        </Typography>
        {mainText.map((textArray, index: number) =>
          getComponent(textArray.format, textArray.text, index, textAreaID)
        )}
        {footnotes.map((text, index: number) => {
          if (text.format === Format.SectionHeader) {
            return (
              <SectionHeader
                text={text.text}
                key={index}
                textAreaID={textAreaID}
              />
            );
          } else {
            return (
              <FootnoteText
                text={text.text}
                key={index}
                dataIndex={textAreaID}
              />
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
  // console.log(bodies);

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
  const ref = useRef(null);
  const [height, setHeight] = useState(0);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const resize = () => {
      setHeight(ref.current.clientHeight);
      setWidth(ref.current.clientWidth);
    };
    resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, [headers]);

  return (
    <Scrollbars
      style={maxWidth}
      universal
      renderThumbVertical={({ style, ...props }) => (
        <div {...props} style={isDarkMode ? dark(style) : light(style)} />
      )}
    >
      <div ref={ref}>
        <NoSSRCanvas className={styles.canvas} width={width} height={height} />
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
              textAreaID={index}
            />
          ))}
        </div>
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
