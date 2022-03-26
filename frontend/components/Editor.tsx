import clsx from 'clsx';
import dynamic from 'next/dynamic';
import Header from './Header';
import Paper from '@mui/material/Paper';
import React, {
  MutableRefObject,
  useEffect,
  useRef,
  useState
  } from 'react';
import SearchBar from './SearchBar';
import styles from '../styles/Editor.module.css';
import Typography from '@mui/material/Typography';
import { Format, scrollbarWidth } from '../common/constants';
import { get } from '../common/utils';
import { InlineNotes } from './InlineNotes';
import { Passage, TextInfo } from '../common/types';
import { Regex } from '../common/constants';
import { Scrollbars } from 'react-custom-scrollbars-2';
import { useSettings } from '../contexts/Settings';
import { useTexts } from '../contexts/Texts';


const NoSSRCanvas = dynamic(() => import("./Canvas/Canvas"), {
  ssr: false,
});

const InlineFootnote = ({ textInfo }: { textInfo: TextInfo }) => {
  return (
    <Typography
      variant="overline"
      className={clsx(styles.inlineFootnote, styles.superscript)}
    >
      {textInfo.text}
    </Typography>
  );
};

const StandardText = ({
  textAreaID,
  textInfo,
}: {
  textAreaID: number;
  textInfo: TextInfo;
}) => {
  const phrases = textInfo.text.split(Regex.WordBoundary);
  return (
    <>
      {phrases.map((item, index) => (
        <span id={[textAreaID, textInfo.id, index + 1].toString()} key={index}>
          {item}
        </span>
      ))}
    </>
  );
};

const SectionHeader = ({
  textInfo,
  textAreaID,
}: {
  textInfo: TextInfo;
  textAreaID: number;
}) => {
  return (
    <span className={styles.sectionHeader}>
      <StandardText textInfo={textInfo} textAreaID={textAreaID} />
    </span>
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
      id={[textAreaID, textInfo.lineId, 0, -1].toString()}
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
        .split(Regex.WithinAsterisks)
        .map((text, index) =>
          text.match(Regex.WithinAsterisks) ? (
            <ItalicsBlock text={text} key={index} />
          ) : (
            text
          )
        )}
    </div>
  );
};

const ParagraphSpacer = () => {
  return <div></div>;
};

const TextArea = ({
  textName,
  textBody,
  textAreaID,
}: {
  textName: string;
  textBody: TextInfo[];
  textAreaID: number;
}) => {
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
        textAreaID,
        key: textInfo.id,
      }),
      [Format.VerseNumber]: React.createElement(VerseNumber, {
        textInfo,
        textAreaID,
        key: textInfo.id,
      }),
      [Format.SpecialNote]: React.createElement(SpecialNote, {
        textInfo,
        textAreaID,
        key: textInfo.id,
      }),
      [Format.StandardText]: React.createElement(StandardText, {
        textInfo,
        textAreaID,
        key: textInfo.id,
      }),
      [Format.LineBreak]: React.createElement(ParagraphSpacer, {
        key: textInfo.id,
      }),
      [Format.InlineFootnote]: React.createElement(InlineFootnote, {
        textInfo,
        key: textInfo.id,
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
      <div className={styles.textHeaderContainer}>
        <Typography variant="h6" className={styles.textHeader} id="0,0,0,-1">
          {textName}
        </Typography>
      </div>
      {textBody.map((textInfo) =>
        getComponent({
          textInfo,
          textAreaID,
        })
      )}
    </div>
  );
};

const MainRegion = () => {
  const { texts } = useTexts();
  const { settings } = useSettings();

  const maxWidth = { width: "100%", height: "100%" };
  const canvasContainerRef = useRef() as MutableRefObject<HTMLDivElement>;
  const [height, setHeight] = useState(0);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const resize = () => {
      setHeight(canvasContainerRef.current.clientHeight);
      setWidth(canvasContainerRef.current.clientWidth - scrollbarWidth);
    };
    resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, [texts]);

  return (
    <Scrollbars
      style={maxWidth}
      universal
      renderThumbVertical={({ style, ...props }) => (
        <div
          {...props}
          className={settings.isDarkMode ? styles.dark : styles.light}
        />
      )}
    >
      <div
        ref={canvasContainerRef}
        id="canvasContainer"
        className={styles.playArea}
      >
        <InlineNotes canvasContainer={canvasContainerRef} />
        <NoSSRCanvas
          canvasContainer={canvasContainerRef}
          className={styles.canvas}
          width={width}
          height={height}
        />
        <div
          className={clsx(styles.textAreaContainer, {
            [styles.row]: settings.isMultipleRowsLayout,
            [styles.col]: !settings.isMultipleRowsLayout,
          })}
          data-testid="textAreaContainer"
        >
          {texts.passages.map((textArea: Passage, index: number) => {
            return textArea.isDisplayed ? (
              <TextArea
                textName={textArea.header}
                textBody={textArea.body}
                key={index}
                textAreaID={index}
              />
            ) : null;
          })}
        </div>
      </div>
    </Scrollbars>
  );
};

const Editor = () => {
  return (
    <Paper className={styles.editor} square id="Editor">
      <Header />
      <MainRegion />
      <SearchBar />
    </Paper>
  );
};

export default Editor;
