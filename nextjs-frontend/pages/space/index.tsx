import React, { useState } from "react";
import Head from "next/head";
import styles from "../../styles/Workspace.module.css";
import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";

import ButtonPane from "../../components/ButtonPane";
import SettingsPane from "../../components/SettingsPane";
import Editor from "../../components/Editor";
import TransitionSnackbar from "../../components/TransitionSnackbar";

export default function Workspace() {
  const [people, setPeople] = useState<string[]>([]);
  const [texts, setTexts] = useState<{
    headers: string[];
    bodies: string[][];
    isDisplayed: boolean[];
  }>({
    headers: [],
    bodies: [],
    isDisplayed: [],
  });
  const [layers, setLayers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [settings, setSettings] = useState({
    isLayersOn: true,
    isSettingsOpen: true,
    isDarkMode: useMediaQuery("(prefers-color-scheme: dark)"),
    isMultipleRowsLayout: true,
    isJustified: true,
  });

  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
  }>({
    isOpen: false,
    message: "",
  });

  const displayedText = (): [string[], string[][]] => {
    const indices: number[] = texts.isDisplayed.flatMap((bool, index) =>
      bool ? index : []
    );

    let displayedTextHeaders: string[] = [];
    let displayedTextBodies: string[][] = [];

    for (let item of indices) {
      displayedTextHeaders.push(texts.headers[item]);
      displayedTextBodies.push(texts.bodies[item]);
    }
    return [displayedTextHeaders, displayedTextBodies];
  };

  const displayedTextHeaders = () => displayedText()[0];
  const displayedTextBodies = () => displayedText()[1];

  // Button Pane Functionality
  const toggleDarkMode = (): void => {
    setSettings({ ...settings, isDarkMode: !settings.isDarkMode });
    setSnackbar({
      isOpen: true,
      message: `Dark mode: ${settings.isDarkMode ? "On" : "Off"}`,
    });
  };

  const toggleSettingsPane = (): void => {
    setSettings({ ...settings, isSettingsOpen: !settings.isSettingsOpen });
  };

  const toggleLayers = (): void => {
    setSettings({ ...settings, isLayersOn: !settings.isLayersOn });
    setSnackbar({
      isOpen: true,
      message: `Layers: ${settings.isLayersOn ? "On" : "Off"}`,
    });
  };

  const toggleEditorLayout = (): void => {
    setSettings({
      ...settings,
      isMultipleRowsLayout: !settings.isMultipleRowsLayout,
    });
    setSnackbar({
      isOpen: true,
      message: `Layout: ${
        settings.isMultipleRowsLayout
          ? "Texts stacked vertically"
          : "Texts side-by-side"
      }`,
    });
  };

  const toggleJustify = (): void => {
    setSettings({
      ...settings,
      isJustified: !settings.isJustified,
    });
    setSnackbar({
      isOpen: true,
      message: `Layout: ${
        settings.isJustified ? "Texts justified" : "Texts left-aligned"
      }`,
    });
  };

  const handleCloseSnackbar = (
    event: React.SyntheticEvent | React.MouseEvent,
    reason?: string
  ): void => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbar({ isOpen: false, message: "" });
  };

  let theme = React.useMemo(
    () =>
      createMuiTheme({
        palette: {
          type: settings.isDarkMode ? "dark" : "light",
        },
      }),
    [settings.isDarkMode]
  );

  // Search Bar Functionality
  const handleInputChange = (
    _event: React.ChangeEvent<HTMLInputElement>,
    newValue: string
  ) => {
    setSearchQuery(newValue);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchQuery("");
    const payload = await getText(toTitleCase(searchQuery));
    // To-do: Track how the search bar is being used
    setTexts({
      headers: [...texts.headers, payload.query + " ESV"],
      bodies: [...texts.bodies, payload.passages],
      isDisplayed: [...texts.isDisplayed, true],
    });
  };

  const getText = async (query: string) => {
    const url = "http://localhost:3000/api/";
    const response = await fetch(url + query);
    // const url = `https://api.esv.org/v3/passage/text/`;
    // const response = await fetch(url + new URLSearchParams({ q: query }));
    const payload: {
      query: string;
      canonical: string;
      parsed: number[][];
      passage_meta: object[];
      passages: string[];
    } = await response.json();
    return payload;
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
    setTexts({
      headers: getNew(texts.headers),
      bodies: getNew(texts.bodies),
      isDisplayed: getNew(texts.isDisplayed),
    });
  };

  const handleCheckBoxToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const index = texts.headers.indexOf(event.target.name);
    let newIsDisplayed = [...texts.isDisplayed];
    newIsDisplayed[index] = !newIsDisplayed[index];
    setTexts({ ...texts, isDisplayed: newIsDisplayed });
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
            settings={settings}
            toggleSettingsPane={toggleSettingsPane}
            toggleDarkMode={toggleDarkMode}
            toggleLayers={toggleLayers}
            toggleEditorLayout={toggleEditorLayout}
            toggleJustify={toggleJustify}
          />
          <SettingsPane
            textHeaders={texts.headers}
            handleClose={handleClose}
            handleCheckBoxToggle={handleCheckBoxToggle}
            isSettingsOpen={settings.isSettingsOpen}
          />
          <Editor
            textHeaders={displayedTextHeaders()}
            textBodies={displayedTextBodies()}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isMultipleRowsLayout={settings.isMultipleRowsLayout}
            searchQuery={searchQuery}
            isJustified={settings.isJustified}
          />
        </div>
        <TransitionSnackbar
          open={snackbar.isOpen}
          onClose={handleCloseSnackbar}
          message={snackbar.message}
        />
      </ThemeProvider>
    </div>
  );
}
