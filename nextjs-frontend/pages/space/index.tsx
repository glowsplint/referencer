import React, { useState } from "react";
import Head from "next/head";
import styles from "../../styles/Workspace.module.css";
import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";

import ButtonPane from "./ButtonPane";
import SettingsPane from "./SettingsPane";
import Editor from "./Editor";
import TransitionSnackbar from "./TransitionSnackbar";

import lastVerse from "./text/endings";
import verseIndexer from "./text/verseIndexer";
import textArray from "./text/esv";

export default function Workspace() {
  const [people, setPeople] = useState<string[]>([]);
  const [textHeaders, setTextHeaders] = useState<string[]>([]);
  const [textBodies, setTextBodies] = useState<string[][]>([]);
  const [layers, setLayers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [isMultipleRowsLayout, setIsMultipleRowsLayout] =
    useState<boolean>(true);
  const [isLayersOn, setIsLayersOn] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(
    useMediaQuery("(prefers-color-scheme: dark)")
  );
  const [isDisplayed, setIsDisplayed] = useState<boolean[]>([]);
  const [snackbar, setSnackbar] = useState<{ isOpen: boolean; text: string }>({
    isOpen: false,
    text: "",
  });

  const displayedText = (): [string[], string[][]] => {
    const indices: number[] = isDisplayed.map((item, index) => {
      if (item === true) {
        return index;
      }
    });

    let displayedTextHeaders: string[] = [];
    let displayedTextBodies: string[][] = [];

    for (let item of indices) {
      displayedTextHeaders.push(textHeaders[item]);
      displayedTextBodies.push(textBodies[item]);
    }
    return [displayedTextHeaders, displayedTextBodies];
  };

  const displayedTextHeaders = () => displayedText()[0];
  const displayedTextBodies = () => displayedText()[1];

  // Button Pane Functionality
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    setSnackbar({
      isOpen: true,
      text: `Dark mode: ${isDarkMode ? "On" : "Off"}`,
    });
  };

  const toggleSettingsPane = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  const toggleLayers = () => {
    setIsLayersOn(!isLayersOn);
    setSnackbar({
      isOpen: true,
      text: `Layers: ${isLayersOn ? "On" : "Off"}`,
    });
  };

  const toggleEditorLayout = () => {
    setIsMultipleRowsLayout(!isMultipleRowsLayout);
    setSnackbar({
      isOpen: true,
      text: `Layout: ${isMultipleRowsLayout ? "Rows" : "Columns"}`,
    });
  };

  const handleCloseSnackbar = (
    event: React.SyntheticEvent | React.MouseEvent,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbar({ isOpen: false, text: "" });
  };

  let theme = React.useMemo(
    () =>
      createMuiTheme({
        palette: {
          type: isDarkMode ? "dark" : "light",
        },
      }),
    [isDarkMode]
  );

  // Search Bar Functionality
  const handleInputChange = (
    _event: React.ChangeEvent<HTMLInputElement>,
    newValue: string
  ) => {
    setSearchQuery(newValue);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const [query, textBody] = checkInvalidInput(
      parseSearch(toTitleCase(searchQuery))
    );

    if (query !== undefined) {
      setTextHeaders([...textHeaders, query]);
      setTextBodies([...textBodies, textBody]);
      setIsDisplayed([...isDisplayed, true]);
    }
    // Clear the search bar
    setSearchQuery("");
  };

  const checkInvalidInput = ({
    query,
    mainText,
  }: {
    query: string;
    mainText: (string | undefined)[];
  }): [string | undefined, string[] | undefined] => {
    if (typeof mainText === "undefined") {
      query = undefined;
      mainText = undefined;
    }
    return [query, mainText];
  };

  const parseSingleVerse = (
    query: string,
    match: RegExpMatchArray
  ): { query: string; mainText: string[] } => {
    // 1 John 1:1, Genesis 1:1
    const book = match[1];
    const chapter = match[2];
    const verse = match[3];
    const mainText: (string | undefined)[] = [
      textArray[verseIndexer[book]?.[chapter]?.[verse]],
    ];
    return { query, mainText };
  };

  const parseSingleChapter = (
    query: string,
    match: RegExpMatchArray
  ): {
    query: string;
    mainText: (string | undefined)[];
  } => {
    // 1 John 1, {Genesis} {1}
    const book = match[1];
    const chapter = match[2];
    const firstIndex: number = verseIndexer[book]?.[chapter]?.["1"];
    const lastIndex: number =
      verseIndexer[book]?.[chapter]?.[lastVerse[book]?.[chapter]] + 1;
    const mainText: (string | undefined)[] = textArray.slice(
      firstIndex,
      lastIndex
    );
    return { query, mainText };
  };

  const parseWithinChapter = (
    query: string,
    match: RegExpMatchArray
  ): {
    query: string;
    mainText: (string | undefined)[];
  } => {
    // 1 John 1:1-3, {Genesis} {1}:{1}-{3}
    const book = match[1];
    const chapter = match[2];
    const verseStart = match[3];
    const verseEnd = match[4];
    const firstIndex = verseIndexer[book]?.[chapter]?.[verseStart];
    const lastIndex = verseIndexer[book]?.[chapter]?.[verseEnd] + 1;
    const mainText: (string | undefined)[] = textArray.slice(
      firstIndex,
      lastIndex
    );
    return { query, mainText };
  };

  const parseAcrossChapters = (
    query: string,
    match: RegExpMatchArray
  ): {
    query: string;
    mainText: (string | undefined)[];
  } => {
    // 1 John 1:1-2:3, {Genesis} {1}:{1}-{2}:{3}
    const book = match[1];
    const [chapterStart, verseStart] = [match[2], match[3]];
    const [chapterEnd, verseEnd] = [match[4], match[5]];
    const firstIndex = verseIndexer[book]?.[chapterStart]?.[verseStart];
    const lastIndex = verseIndexer[book]?.[chapterEnd]?.[verseEnd] + 1;
    const mainText: (string | undefined)[] = textArray.slice(
      firstIndex,
      lastIndex
    );
    return { query, mainText };
  };

  const parseMultipleChapters = (
    query: string,
    match: RegExpMatchArray
  ): {
    query: string;
    mainText: (string | undefined)[];
  } => {
    // 1 John 1-2, {Genesis} {1}-{2}
    const book = match[1];
    const chapterStart = match[2];
    const chapterEnd = match[3];
    const firstIndex = verseIndexer[book]?.[chapterStart]?.["1"];
    const lastIndex =
      verseIndexer[book]?.[chapterEnd]?.[lastVerse[book]?.[chapterEnd]] + 1;
    const mainText: (string | undefined)[] = textArray.slice(
      firstIndex,
      lastIndex
    );
    return { query, mainText };
  };

  // Write a function that returns the match and the parsing function as an object
  const parseSearch = (
    query: string
  ): {
    query: string;
    mainText: (string | undefined)[];
  } => {
    const singleVerseRegExp =
      /^((?:[0-9][\s])?(?:[A-Za-z]+))\s([0-9]+):([0-9]+)$/;
    const singleChapterRegExp = /^((?:[0-9][\s])?(?:[A-Za-z]+))\s([0-9]+)$/;
    const withinChapterRegExp =
      /^((?:[0-9][\s])?(?:[A-Za-z]+))\s([0-9]+):([0-9]+)-([0-9]+)$/;
    const acrossChaptersRegExp =
      /^((?:[0-9][\s])?(?:[A-Za-z]+))\s([0-9]+):([0-9]+)-([0-9]+):([0-9]+)$/;
    const multipleChaptersRegExp =
      /^((?:[0-9][\s])?(?:[A-Za-z]+))\s([0-9]+)-([0-9]+)$/;
    const singleVerseMatch = query.match(singleVerseRegExp);
    const singleChapterMatch = query.match(singleChapterRegExp);
    const withinChapterMatch = query.match(withinChapterRegExp);
    const acrossChaptersMatch = query.match(acrossChaptersRegExp);
    const multipleChaptersMatch = query.match(multipleChaptersRegExp);

    if (singleVerseMatch !== null) {
      return parseSingleVerse(query, singleVerseMatch);
    } else if (singleChapterMatch !== null) {
      return parseSingleChapter(query, singleChapterMatch);
    } else if (withinChapterMatch !== null) {
      return parseWithinChapter(query, withinChapterMatch);
    } else if (acrossChaptersMatch !== null) {
      return parseAcrossChapters(query, acrossChaptersMatch);
    } else if (multipleChaptersMatch !== null) {
      return parseMultipleChapters(query, multipleChaptersMatch);
    }
    return { query: undefined, mainText: undefined };
  };

  const toTitleCase = (str: string) => {
    return str.replace(
      /\w\S*/g,
      (text: string) =>
        text.charAt(0).toUpperCase() + text.substr(1).toLowerCase()
    );
  };

  // Settings Pane Functionality
  const handleClose = (key: number) => {
    const getNew = (oldArray: any[]) => [
      ...oldArray.slice(0, key),
      ...oldArray.slice(key + 1, oldArray.length),
    ];
    setTextHeaders(getNew(textHeaders));
    setTextBodies(getNew(textBodies));
    setIsDisplayed(getNew(isDisplayed));
  };

  const handleCheckBoxToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    // If target is newly checked, move the text from
    console.log(event.target.checked);
    return;
  };

  return (
    <div>
      <Head>
        <title>space-1</title>
        <meta name="description" content="Space" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <ThemeProvider theme={theme}>
        <div className={styles.app}>
          <ButtonPane
            toggleSettingsPane={toggleSettingsPane}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            isLayersOn={isLayersOn}
            toggleLayers={toggleLayers}
            isMultipleRowsLayout={isMultipleRowsLayout}
            toggleEditorLayout={toggleEditorLayout}
          />
          <SettingsPane
            textHeaders={textHeaders}
            handleClose={handleClose}
            handleCheckBoxToggle={handleCheckBoxToggle}
            isSettingsOpen={isSettingsOpen}
          />
          <Editor
            textHeaders={displayedTextHeaders()}
            textBodies={displayedTextBodies()}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isMultipleRowsLayout={isMultipleRowsLayout}
            searchQuery={searchQuery}
          />
        </div>
        <TransitionSnackbar
          open={snackbar.isOpen}
          onClose={handleCloseSnackbar}
          message={snackbar.text}
        />
      </ThemeProvider>
    </div>
  );
}
