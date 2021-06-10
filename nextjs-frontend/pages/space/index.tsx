import React, { useState } from "react";
import Head from "next/head";
import styles from "./Space.module.css";
import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import CssBaseline from "@material-ui/core/CssBaseline";
import { toTitleCase } from "../../components/utils";

import ButtonPane from "../../components/ButtonPane";
import SettingsPane from "../../components/SettingsPane";
import Editor from "../../components/Editor";
import { LoginProvider } from "../../contexts/Login";
import { TextsProvider, useTexts } from "../../contexts/Texts";

export function Space() {
  const { texts, setTexts } = useTexts();
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [settings, setSettings] = useState({
    isLayersOn: true,
    isSettingsOpen: true,
    isDarkMode: useMediaQuery("(prefers-color-scheme: dark)"),
    isMultipleRowsLayout: true,
    isJustified: true,
  });

  const toggle = React.useMemo(
    () => ({
      darkMode: (): void => {
        setSettings({ ...settings, isDarkMode: !settings.isDarkMode });
      },
      settingsPane: (): void => {
        setSettings({ ...settings, isSettingsOpen: !settings.isSettingsOpen });
      },
      layers: (): void => {
        setSettings({ ...settings, isLayersOn: !settings.isLayersOn });
      },
      editorLayout: (): void => {
        setSettings({
          ...settings,
          isMultipleRowsLayout: !settings.isMultipleRowsLayout,
        });
      },
      justify: (): void => {
        setSettings({
          ...settings,
          isJustified: !settings.isJustified,
        });
      },
    }),
    [settings]
  );

  let theme = React.useMemo(
    () =>
      createMuiTheme({
        palette: {
          type: settings.isDarkMode ? "dark" : "light",
        },
      }),
    [settings.isDarkMode]
  );

  const handleSearch = React.useMemo(
    () => ({
      inputChange: (
        _event: React.ChangeEvent<HTMLInputElement>,
        newValue: string
      ) => {
        setSearchQuery(newValue);
      },
      submit: async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (searchQuery !== "") {
          setSearchQuery("");
          const payload = await getText(toTitleCase(searchQuery));
          setTexts({
            headers: [...texts.headers, payload.query + " ESV"],
            bodies: [...texts.bodies, payload.passages[0]],
            isDisplayed: [...texts.isDisplayed, true],
          });
        }
      },
    }),
    [searchQuery]
  );

  const handleSettingsTexts = React.useMemo(
    () => ({
      close: (key: number) => {
        const getNew = (oldArray: any[]) => [
          ...oldArray.slice(0, key),
          ...oldArray.slice(key + 1, oldArray.length),
        ];
        setTexts({
          headers: getNew(texts.headers),
          bodies: getNew(texts.bodies),
          isDisplayed: getNew(texts.isDisplayed),
        });
      },
      checkBoxToggle: (event: React.ChangeEvent<HTMLInputElement>) => {
        const index = texts.headers.indexOf(event.target.name);
        let newIsDisplayed = [...texts.isDisplayed];
        newIsDisplayed[index] = !newIsDisplayed[index];
        setTexts({ ...texts, isDisplayed: newIsDisplayed });
      },
    }),
    [texts]
  );

  const getText = async (query: string) => {
    let url = "http://localhost:3000/api/";
    if (process.env.NODE_ENV === "production") {
      url = "http://localhost:5000/api/";
    }
    const response = await fetch(url + encodeURIComponent(query));
    const payload: {
      query: string;
      canonical: string;
      parsed: number[][];
      passage_meta: object[];
      passages: string[];
    } = await response.json();
    return payload;
  };

  return (
    <div>
      <Head>
        <title>Referencer</title>
        <meta name="description" content="Space" />
        <link rel="icon" href="/public/favicon.ico" />
      </Head>

      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className={styles.app}>
          <ButtonPane
            settings={settings}
            toggleSettingsPane={toggle.settingsPane}
            toggleDarkMode={toggle.darkMode}
            toggleLayers={toggle.layers}
            toggleEditorLayout={toggle.editorLayout}
            toggleJustify={toggle.justify}
          />
          <SettingsPane
            handleClose={handleSettingsTexts.close}
            handleCheckBoxToggle={handleSettingsTexts.checkBoxToggle}
            isSettingsOpen={settings.isSettingsOpen}
          />
          <Editor
            handleInputChange={handleSearch.inputChange}
            handleSubmit={handleSearch.submit}
            isMultipleRowsLayout={settings.isMultipleRowsLayout}
            searchQuery={searchQuery}
            isJustified={settings.isJustified}
            isDarkMode={settings.isDarkMode}
          />
        </div>
      </ThemeProvider>
    </div>
  );
}

export default function Index() {
  return (
    <TextsProvider>
      <LoginProvider>
        <Space />
      </LoginProvider>
    </TextsProvider>
  );
}
