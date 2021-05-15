import React from "react";
import Head from "next/head";
import ButtonPane from "./ButtonPane";
import SettingsPane from "./SettingsPane";
import Editor from "./Editor";
import styles from "./App.module.css";
import "@fontsource/roboto";

import useMediaQuery from "@material-ui/core/useMediaQuery";
import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles";

export default function App() {
  let prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  function toggleDarkMode() {
    prefersDarkMode = !prefersDarkMode;
    console.log("Inverted Colors.");
  }

  let theme = React.useMemo(
    () =>
      createMuiTheme({
        palette: {
          type: prefersDarkMode ? "dark" : "light",
        },
      }),
    [prefersDarkMode]
  );

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
            menu={toggleDarkMode}
            invertColors={toggleDarkMode}
            palette={toggleDarkMode}
          />
          <SettingsPane />
          <Editor />
        </div>
      </ThemeProvider>
    </div>
  );
}
