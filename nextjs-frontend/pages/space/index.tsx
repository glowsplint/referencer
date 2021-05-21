import React, { useState } from "react";
import Head from "next/head";
import styles from "../../styles/Workspace.module.css";
import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";

import ButtonPane from "./ButtonPane";
import SettingsPane from "./SettingsPane";
import Editor from "./Editor";

export default function Workspace() {
  let prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  let settingsOpen = true;
  let paletteToggle = true;
  const [people, setPeople] = useState([]);
  const [texts, setTexts] = useState([]);
  const [layers, setLayers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Button Pane Functionality
  const toggleDarkMode = () => {
    prefersDarkMode = !prefersDarkMode;
    console.log(`Inverted Colors: prefersDarkMode is: ${prefersDarkMode}`);
  };

  const toggleSettingsPane = () => {
    settingsOpen = !settingsOpen;
    console.log("Closed/Opened settings pane.");
  };

  const togglePalette = () => {
    paletteToggle = !paletteToggle;
    console.log("Toggled palette.");
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
  const handleInputChange = (_event, newValue: string) => {
    setSearchQuery(newValue);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // Handling the texts: Replaces second text if we will have more than 2 texts
    const newTexts: string[] = [...texts, searchQuery];
    setTexts(newTexts);
    setSearchQuery("");
  };

  // Settings Pane Functionality
  const handleClose = (key: number) => {
    const newTexts: string[] = [
      ...texts.slice(0, key),
      ...texts.slice(key + 1, texts.length),
    ];
    setTexts(newTexts);
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
          <SettingsPane texts={texts} handleClose={handleClose} />
          <Editor
            texts={texts}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            searchQuery={searchQuery}
          />
        </div>
      </ThemeProvider>
    </div>
  );
}
