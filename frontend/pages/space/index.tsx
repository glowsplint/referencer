import React, { useEffect } from "react";
import { SettingsProvider, useSettings } from "../../contexts/Settings";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import { AnnotationsProvider } from "../../contexts/Annotations";
import ButtonPane from "../../components/ButtonPane";
import Editor from "../../components/Editor";
import Head from "next/head";
import { LoginProvider } from "../../contexts/Login";
import SettingsPane from "../../components/SettingsPane";
import { TextsProvider } from "../../contexts/Texts";
import { TrackingProvider } from "../../contexts/Tracking";
import styles from "../../styles/Space.module.css";

const DefaultLayout = () => {
  return (
    <>
      <ButtonPane />
      <SettingsPane />
      <Editor />
    </>
  );
};

const ZenMode = () => {
  const { setSettings } = useSettings();
  const handleKeyPress = (_event: Event) => {
    if (document.fullscreenElement) return;
    setSettings((previous) => {
      return { ...previous, isZenMode: false };
    });
  };
  useEffect(() => {
    const element = document.documentElement;
    element.onfullscreenchange = handleKeyPress;
  });
  return (
    <>
      <div className={styles.spacer} />
      <Editor />
      <div className={styles.spacer} />
    </>
  );
};

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
          {settings.isZenMode ? <ZenMode /> : <DefaultLayout />}
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
            <AnnotationsProvider>
              <Space />
            </AnnotationsProvider>
          </TrackingProvider>
        </TextsProvider>
      </SettingsProvider>
    </LoginProvider>
  );
}
