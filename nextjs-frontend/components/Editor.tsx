import { NaNInterval, useAnnotations } from "../contexts/Annotations";
import { ParsedText, TextInfo, useTexts } from "../contexts/Texts";
import React, { MutableRefObject, useEffect, useRef, useState } from "react";

import { Format } from "../common/enums";
import Header from "./Header";
import Paper from "@mui/material/Paper";
import { REGEX } from "../common/enums";
import { Scrollbars } from "react-custom-scrollbars-2";
import SearchBar from "./SearchBar";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import clsx from "clsx";
import dynamic from "next/dynamic";
import { get } from "../common/utils";
import styles from "../styles/Editor.module.css";
import { useSettings } from "../contexts/Settings";

const NoSSRCanvas = dynamic(() => import("./Canvas"), {
  ssr: false,
});

const PureText = ({
  phrase,
  id,
  removeLeadingWhitespace,
}: {
  phrase: string;
  id: [number, number, number];
  removeLeadingWhitespace?: boolean;
}) => {
  const [firstItem, ...rest] = phrase.split(REGEX.wordBoundary);
  return (
    <>
      <span
        className={clsx({
          [styles.withLeadingWhitespace]: !removeLeadingWhitespace,
          [styles.noLeadingWhitespace]: removeLeadingWhitespace,
        })}
        id={[...id, 0].toString()}
      >
        {firstItem}
      </span>
      {rest.map((item, index) => (
        <span id={[...id, index + 1].toString()} key={index}>
          {item}
        </span>
      ))}
    </>
  );
};

PureText.defaultProps = {
  removeLeadingWhitespace: false,
};

const InlineFootnote = ({ text, id }: { text: string; id: string }) => {
  return (
    <Typography
      variant="overline"
      className={clsx(styles.inlineFootnote, styles.superscript)}
      id={id}
    >
      {text}
    </Typography>
  );
};

const StandardText = ({
  removeLeadingWhitespace,
  textAreaID,
  textInfo,
}: {
  removeLeadingWhitespace?: boolean;
  textAreaID: number;
  textInfo: TextInfo;
}) => {
  const charArray = textInfo.text.split(REGEX.inlineFootnote);

  // <text> may contain inline footnotes i.e. `(3)`.
  return (
    <>
      {charArray.map((item, index) => {
        if (item.match(REGEX.inlineFootnote)) {
          return (
            <InlineFootnote
              text={item}
              key={index}
              id={[textAreaID, textInfo.id, index, 0].toString()}
            />
          );
        }
        return (
          <PureText
            phrase={item}
            id={[textAreaID, textInfo.id, index]}
            key={index}
            removeLeadingWhitespace={removeLeadingWhitespace}
          />
        );
      })}
    </>
  );
};

StandardText.defaultProps = {
  removeLeadingWhitespace: false,
};

const SectionHeader = ({
  textInfo,
  textAreaID,
}: {
  textInfo: TextInfo;
  textAreaID: number;
}) => {
  return (
    <div className={styles.sectionHeader}>
      <StandardText textInfo={textInfo} textAreaID={textAreaID} />
    </div>
  );
};

const SpecialNote = ({
  textInfo,
  textAreaID,
}: {
  textInfo: TextInfo;
  textAreaID: number;
}) => {
  // Matches special notes in John 7 and Mark 16
  return (
    <div className={styles.specialNote}>
      <StandardText textInfo={textInfo} textAreaID={textAreaID} />
    </div>
  );
};

const ItalicsBlock = ({ text }: { text: string }) => {
  // Removes the asterisks on the ends before rendering
  const textWithoutAsterisks = text.slice(1, text.length - 1);
  return <i>{textWithoutAsterisks}</i>;
};

const VerseNumber = ({
  textInfo,
  textAreaID,
}: {
  textInfo: TextInfo;
  textAreaID: number;
}) => {
  return (
    <Typography
      variant="button"
      className={clsx(styles.verseNumber, styles.superscript)}
      id={[textAreaID, textInfo.id, 0, -1].toString()}
    >
      {textInfo.text}
    </Typography>
  );
};

const FootnoteText = ({ text }: { text: string }) => {
  // Splits the text into several chunks comprising:
  // 1. Words to be italicised
  // 2. Words in standard formatting
  // Dispatches to their respective component for rendering
  return (
    <div className={styles.footnoteText}>
      {text
        .split(REGEX.withinAsterisks)
        .map((text, index) =>
          text.match(REGEX.withinAsterisks) ? (
            <ItalicsBlock text={text} key={index} />
          ) : (
            text
          )
        )}
    </div>
  );
};

const Quotes = ({
  textInfo,
  textAreaID,
}: {
  textInfo: TextInfo;
  textAreaID: number;
}) => {
  // Adds a new paragraph before the start of a quote
  return (
    <>
      <ParagraphSpacer textAreaID={textAreaID} />
      <StandardText
        textInfo={textInfo}
        textAreaID={textAreaID}
        removeLeadingWhitespace
      />
    </>
  );
};

const ParagraphSpacer = ({ textAreaID }: { textAreaID: number }) => {
  const textInfo = { id: -1, text: "", format: Format.SectionHeader };
  return <SectionHeader textInfo={textInfo} textAreaID={textAreaID} />;
};

const Psalm426 = ({
  textInfo,
  textAreaID,
}: {
  textInfo: TextInfo;
  textAreaID: number;
}) => {
  // Special handling for Psalm 42:6
  // The parsing engine assumes that text appearing after text should be formatted as a SectionHeader
  // This is a special case hardcoded as an exception.
  return (
    <>
      <ParagraphSpacer textAreaID={textAreaID} />
      <StandardText textInfo={textInfo} textAreaID={textAreaID} />
    </>
  );
};

const TextArea = React.memo(
  ({
    textName,
    textBody,
    textAreaID,
  }: {
    textName: string;
    textBody: ParsedText;
    textAreaID: number;
  }) => {
    const { mainText, footnotes } = textBody;
    const { settings } = useSettings();

    const getComponent = ({
      textInfo,
      textAreaID,
    }: {
      textInfo: TextInfo;
      textAreaID: number;
    }) => {
      const componentMap = {
        [Format.SectionHeader]: React.createElement(SectionHeader, {
          textInfo,
          key: textInfo.id,
          textAreaID,
        }),
        [Format.VerseNumber]: React.createElement(VerseNumber, {
          textInfo,
          key: textInfo.id,
          textAreaID,
        }),
        [Format.SpecialNote]: React.createElement(SpecialNote, {
          textInfo,
          key: textInfo.id,
          textAreaID,
        }),
        [Format.Quotes]: React.createElement(Quotes, {
          textInfo,
          key: textInfo.id,
          textAreaID,
        }),
        [Format.StandardText]: React.createElement(StandardText, {
          textInfo,
          key: textInfo.id,
          textAreaID,
        }),
        [Format.TripleLineFeedAtEnd]: React.createElement(ParagraphSpacer, {
          key: textInfo.id,
          textAreaID,
        }),
        [Format.Psalm426]: React.createElement(Psalm426, {
          textInfo,
          key: textInfo.id,
          textAreaID,
        }),
      };

      // Defaults to StandardText if no matching format found from componentMap
      return get(
        componentMap,
        textInfo.format,
        componentMap[Format.StandardText]
      );
    };

    return (
      <div
        className={clsx(styles.textArea, {
          [styles.justify]: settings.isJustified,
          [""]: !settings.isJustified,
        })}
        id={textAreaID.toString()}
      >
        <Typography variant="h6" className={styles.textHeader}>
          {textName}
        </Typography>
        {mainText.map((textInfo) =>
          getComponent({
            textInfo,
            textAreaID,
          })
        )}
        {footnotes.map((textInfo) => {
          if (textInfo.format === Format.SectionHeader) {
            return (
              <SectionHeader
                textInfo={textInfo}
                key={textInfo.id}
                textAreaID={textAreaID}
              />
            );
          } else {
            return <FootnoteText text={textInfo.text} key={textInfo.id} />;
          }
        })}
      </div>
    );
  }
);

const MainRegion = () => {
  const { texts } = useTexts();
  const { settings } = useSettings();
  const { annotations } = useAnnotations();

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
  const ref = useRef() as MutableRefObject<HTMLDivElement>;
  const [height, setHeight] = useState(0);
  const [width, setWidth] = useState(0);
  const scrollbarWidth = 10;

  useEffect(() => {
    const resize = () => {
      setHeight(ref.current.clientHeight);
      setWidth(ref.current.clientWidth - scrollbarWidth);
    };
    resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, [texts]);

  const isNotesInCreationNull =
    annotations.notes.inCreation.interval.start == NaNInterval ||
    annotations.notes.inCreation.interval.start == NaNInterval;
  const notes = [
    ...annotations.notes.finished,
    isNotesInCreationNull ? null : annotations.notes.inCreation,
  ].filter(Boolean);

  return (
    <Scrollbars
      style={maxWidth}
      universal
      renderThumbVertical={({ style, ...props }) => (
        <div
          {...props}
          style={settings.isDarkMode ? dark(style) : light(style)}
        />
      )}
    >
      <div ref={ref} id="canvasContainer" className={styles.playArea}>
        <NoSSRCanvas className={styles.canvas} width={width} height={height} />
        <div
          className={clsx(styles.textAreaContainer, {
            [styles.row]: settings.isMultipleRowsLayout,
            [styles.col]: !settings.isMultipleRowsLayout,
          })}
          data-testid="textAreaContainer"
        >
          {texts.headers.map((textHeader: string, index: number) => (
            <TextArea
              textName={textHeader}
              textBody={texts.bodies[index]}
              key={index}
              textAreaID={index}
            />
          ))}
        </div>

        <div className={styles.annotationRightMargin}>
          {notes.map((item, index) => (
            <TextField
              id="outlined-basic"
              label="Outlined"
              variant="outlined"
              key={index}
            />
          ))}
        </div>
      </div>
    </Scrollbars>
  );
};

const Editor = React.memo(() => {
  return (
    <Paper className={styles.editor}>
      <Header />
      <MainRegion />
      <SearchBar />
    </Paper>
  );
});

export default Editor;
