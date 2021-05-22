import React, { useState } from "react";
import Head from "next/head";
import styles from "../../styles/Workspace.module.css";
import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";

import ButtonPane from "./ButtonPane";
import SettingsPane from "./SettingsPane";
import Editor from "./Editor";
import lastVerse from "./text/endings";
import verseIndexer from "./text/verseIndexer";
import textArray from "./text/esv";

export default function Workspace() {
  let prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  let settingsOpen = true;
  let paletteToggle = true;
  const [people, setPeople] = useState([]);
  const [texts, setTexts] = useState([]);
  const [textHeaders, setTextHeaders] = useState<string[]>([]);
  const [textBodies, setTextBodies] = useState<string[][]>([]);
  const [layers, setLayers] = useState([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [isDisplayed, setIsDisplayed] = useState<string[]>([]);
  const displayedText = (): [string[], string[][]] => {
    const indexLeft = isDisplayed.findIndex((x) => x === "left");
    const indexRight = isDisplayed.findIndex((x) => x === "right");
    const displayedTextHeaders = [
      textHeaders[indexLeft],
      textHeaders[indexRight],
    ].filter((x) => x !== undefined);
    const displayedTextBodies = [
      textBodies[indexLeft],
      textBodies[indexRight],
    ].filter((x) => x !== undefined);
    return [displayedTextHeaders, displayedTextBodies];
  };

  const displayedTextHeaders = () => displayedText()[0];
  const displayedTextBodies = () => displayedText()[1];

  // Button Pane Functionality
  const toggleDarkMode = () => {
    prefersDarkMode = !prefersDarkMode;
  };

  const toggleSettingsPane = () => {
    settingsOpen = !settingsOpen;
  };

  const togglePalette = () => {
    paletteToggle = !paletteToggle;
  };

  let theme = React.useMemo(
    () =>
      createMuiTheme({
        palette: {
          type: prefersDarkMode ? "dark" : "light",
        },
      }),
    [prefersDarkMode]
  );

  // Search Bar Functionality
  const handleInputChange = (
    _event: React.ChangeEvent<HTMLInputElement>,
    newValue: string
  ) => {
    setSearchQuery(newValue);
  };

  const handleSubmit = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    // Handling the texts: Replaces second text if we will have more than 2 texts
    let newTexts: string[];
    const [query, textBody] = parseSearch(toTitleCase(searchQuery));

    if (query !== undefined) {
      newTexts = [...texts, query];
      setTexts(newTexts);

      // Fill any available empty text area, starting with textOne
      if (displayedTextHeaders()[0] === undefined) {
        setTextHeaders([query]);
        setTextBodies([textBody]);
        setIsDisplayed(["left"]);
      } else if (displayedTextHeaders()[1] === undefined) {
        setTextHeaders([displayedTextHeaders()[0], query]);
        setTextBodies([textBodies[0], [...textBody]]);
        setIsDisplayed(["left", "right"]);
      } else {
        setIsDisplayed([...isDisplayed, "false"]);
      }
    }
    // Clear the search bar
    setSearchQuery("");
  };

  const parseSingleVerse = (
    query: string,
    match: RegExpMatchArray
  ): [string, string[]] => {
    // 1 John 1:1, Genesis 1:1
    const book = match[1];
    const chapter = match[2];
    const verse = match[3];
    return [query, [textArray[verseIndexer[book][chapter][verse]]]];
  };

  const parseSingleChapter = (
    query: string,
    match: RegExpMatchArray
  ): [string, string[]] => {
    // 1 John 1, {Genesis} {1}
    const book = match[1];
    const chapter = match[2];
    const firstIndex: number = verseIndexer[book][chapter]["1"];
    const lastIndex: number =
      verseIndexer[book][chapter][lastVerse[book][chapter]] + 1;
    return [query, textArray.slice(firstIndex, lastIndex)];
  };

  const parseWithinChapter = (
    query: string,
    match: RegExpMatchArray
  ): [string, string[]] => {
    // 1 John 1:1-3, {Genesis} {1}:{1}-{3}
    const book = match[1];
    const chapter = match[2];
    const verseStart = match[3];
    const verseEnd = match[4];
    const firstIndex = verseIndexer[book][chapter][verseStart];
    const lastIndex = verseIndexer[book][chapter][verseEnd] + 1;
    return [query, textArray.slice(firstIndex, lastIndex)];
  };

  const parseAcrossChapters = (
    query: string,
    match: RegExpMatchArray
  ): [string, string[]] => {
    // 1 John 1:1-2:3, {Genesis} {1}:{1}-{2}:{3}
    const book = match[1];
    const [chapterStart, verseStart] = [match[2], match[3]];
    const [chapterEnd, verseEnd] = [match[4], match[5]];
    const firstIndex = verseIndexer[book][chapterStart][verseStart];
    const lastIndex = verseIndexer[book][chapterEnd][verseEnd] + 1;
    return [query, textArray.slice(firstIndex, lastIndex)];
  };

  const parseMultipleChapters = (
    query: string,
    match: RegExpMatchArray
  ): [string, string[]] => {
    // 1 John 1-2, {Genesis} {1}-{2}
    const book = match[1];
    const chapterStart = match[2];
    const chapterEnd = match[3];
    const firstIndex = verseIndexer[book][chapterStart]["1"];
    const lastIndex =
      verseIndexer[book][chapterEnd][lastVerse[book][chapterEnd]] + 1;
    return [query, textArray.slice(firstIndex, lastIndex)];
  };

  // Write a function that returns the match and the parsing function as an object
  const parseSearch = (query: string) => {
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
    const newTexts: string[] = [
      ...texts.slice(0, key),
      ...texts.slice(key + 1, texts.length),
    ];
    const newIsDisplayed: string[] = [
      ...isDisplayed.slice(0, key),
      ...isDisplayed.slice(key + 1, isDisplayed.length),
    ];
    setTexts(newTexts);
    setIsDisplayed(newIsDisplayed);
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
            menu={toggleSettingsPane}
            invertColors={toggleDarkMode}
            palette={togglePalette}
          />
          <SettingsPane
            texts={texts}
            handleClose={handleClose}
            handleCheckBoxToggle={handleCheckBoxToggle}
          />
          <Editor
            textHeaders={displayedTextHeaders()}
            textBodies={displayedTextBodies()}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            searchQuery={searchQuery}
          />
        </div>
      </ThemeProvider>
    </div>
  );
}
