import { SettingsProvider, useSettings } from "../../contexts/Settings";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import ButtonPane from "../../components/ButtonPane";
import Editor from "../../components/Editor";
import Head from "next/head";
import { HighlightProvider } from "../../contexts/Highlight";
import { LoginProvider } from "../../contexts/Login";
import React from "react";
import { SelectionProvider } from "../../contexts/Selection";
import SettingsPane from "../../components/SettingsPane";
import { TextsProvider } from "../../contexts/Texts";
import styles from "../../styles/Space.module.css";

export function Space() {
  const { settings } = useSettings();

  let theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: settings.isDarkMode ? "dark" : "light",
        },
      }),
    [settings.isDarkMode]
  );

  return (
    <div>
      <Head>
        <title>Referencer</title>
        <meta name="description" content="Space" />
        <link rel="icon" href="/public/favicon.ico" />
      </Head>

      <ThemeProvider theme={theme}>
        <div className={styles.app}>
          <ButtonPane />
          <SettingsPane />
          <Editor />
        </div>
      </ThemeProvider>
    </div>
  );
}

export default function Index() {
  return (
    <LoginProvider>
      <SettingsProvider>
        <TextsProvider>
          <SelectionProvider>
            <HighlightProvider>
              <Space />
            </HighlightProvider>
          </SelectionProvider>
        </TextsProvider>
      </SettingsProvider>
    </LoginProvider>
  );
}
