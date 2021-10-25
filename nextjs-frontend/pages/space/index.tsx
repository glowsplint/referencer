import ButtonPane from "../../components/ButtonPane";
import CssBaseline from "@mui/material/CssBaseline";
import Editor from "../../components/Editor";
import Head from "next/head";
import React from "react";
import SettingsPane from "../../components/SettingsPane";
import styles from "../../styles/Space.module.css";
import { HighlightProvider } from "../../contexts/Highlight";
import { LoginProvider } from "../../contexts/Login";
import { TextsProvider } from "../../contexts/Texts";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useSettings } from "../../contexts/Settings";
import { SelectionProvider } from "../../contexts/Selection";

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
        <CssBaseline />
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
      <TextsProvider>
        <SelectionProvider>
          <HighlightProvider>
            <Space />
          </HighlightProvider>
        </SelectionProvider>
      </TextsProvider>
    </LoginProvider>
  );
}
