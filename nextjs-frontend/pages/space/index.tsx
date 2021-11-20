import { SettingsProvider, useSettings } from "../../contexts/Settings";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import { AnnotationProvider } from "../../contexts/Annotations";
import ButtonPane from "../../components/ButtonPane";
import Editor from "../../components/Editor";
import Head from "next/head";
import { LoginProvider } from "../../contexts/Login";
import React from "react";
import SettingsPane from "../../components/SettingsPane";
import { TextsProvider } from "../../contexts/Texts";
import { TrackingProvider } from "../../contexts/Tracking";
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
          <TrackingProvider>
            <AnnotationProvider>
              <Space />
            </AnnotationProvider>
          </TrackingProvider>
        </TextsProvider>
      </SettingsProvider>
    </LoginProvider>
  );
}
