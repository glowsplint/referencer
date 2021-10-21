import Header from "./Header";
import React, { MutableRefObject, useEffect, useRef, useState } from "react";
import SearchBar from "./SearchBar";
import Typography from "@mui/material/Typography";
import clsx from "clsx";
import dynamic from "next/dynamic";
import styles from "../styles/Editor.module.css";
import { Format } from "../common/enums";
import { ParsedText, useTexts } from "../contexts/Texts";
import { REGEX } from "../common/enums";
import { Scrollbars } from "react-custom-scrollbars-2";
import { get } from "../common/utils";
import { useSettings } from "../contexts/Settings";

const NoSSRCanvas = dynamic(() => import("./Canvas"), {
  ssr: false,
});

const Text = ({
  phrase,
  removeLeadingWhitespace,
}: {
  phrase: string;
  removeLeadingWhitespace?: boolean;
}) => {
  const [firstItem, ...rest] = phrase.split(REGEX.wordBoundary);
  return (
    <>
      <span
        className={clsx({
          [styles.with_leading_whitespace]: !removeLeadingWhitespace,
          [styles.without_leading_whitespace]: removeLeadingWhitespace,
        })}
      >
        {firstItem}
      </span>
      {rest.map((item, index) => (
        <span key={index}>{item}</span>
      ))}
    </>
  );
};

Text.defaultProps = {
  removeLeadingWhitespace: false,
};

const HighlightDecider = ({
  phrase,
  removeLeadingWhitespace,
}: {
  phrase: string;
  removeLeadingWhitespace?: boolean;
}) => {
  return (
    <Text phrase={phrase} removeLeadingWhitespace={removeLeadingWhitespace} />
  );
};

HighlightDecider.defaultProps = {
  removeLeadingWhitespace: false,
};

const InlineFootnote = ({ text }: { text: string }) => {
  return (
    <Typography variant="overline" className={styles.inline_footnote}>
      <sup>{text}</sup>
    </Typography>
  );
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
  const charArray = text.split(REGEX.inlineFootnote);

  return (
    <>
      {charArray.map((item, index) => {
        if (item.match(REGEX.inlineFootnote)) {
          return <InlineFootnote text={item} key={index} />;
        }
        return (
          <HighlightDecider
            key={index}
            phrase={item}
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

const ItalicsBlock = ({ text }: { text: string }) => {
  // Removes the asterisks on the ends before rendering
  const textWithoutAsterisks = text.slice(1, text.length - 1);
  return <i>{textWithoutAsterisks}</i>;
};

const VerseNumber = ({
  text,
  textAreaID,
}: {
  text: string;
  textAreaID: number;
}) => {
  return (
    <Typography variant="button" className={styles.verse_number}>
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
    textAreaID,
  }: {
    textName: string;
    textBody: ParsedText;
    textAreaID: number;
  }) => {
    const { mainText, footnotes } = textBody;
    const { settings } = useSettings();

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
        [Format.TripleLineFeedAtEnd]: React.createElement(ParagraphSpacer, {
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
          [styles.justify]: settings.isJustified,
          [""]: !settings.isJustified,
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
            return <FootnoteText text={text.text} key={index} />;
          }
        })}
      </div>
    );
  }
);

const MainRegion = () => {
  const { texts } = useTexts();
  const { settings } = useSettings();

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
  }, []);
  // }, [headers]);

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
      <div ref={ref}>
        <NoSSRCanvas className={styles.canvas} width={width} height={height} />
        <div
          className={clsx(styles.editor_textareas, {
            [styles.row]: settings.isMultipleRowsLayout,
            [styles.col]: !settings.isMultipleRowsLayout,
          })}
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
      </div>
    </Scrollbars>
  );
};

const Editor = React.memo(() => {
  return (
    <div className={styles.editor}>
      <Header />
      <MainRegion />
      <SearchBar />
    </div>
  );
});

export default Editor;
