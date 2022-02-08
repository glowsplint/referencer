// import { useMediaQuery } from "@mui/material";

import React, { SetStateAction, useState } from "react";

interface Settings {
  isDarkMode: boolean;
  isZenMode: boolean;
  isJustified: boolean;
  isLayersOn: boolean;
  isMultipleRowsLayout: boolean;
  isSettingsOpen: boolean;
}

const baseSettings = {
  //   isDarkMode: useMediaQuery("(prefers-color-scheme: dark)"),
  isDarkMode: false,
  isZenMode: false,
  isJustified: true,
  isLayersOn: true,
  isMultipleRowsLayout: true,
  isSettingsOpen: true,
};

type SetSettings = React.Dispatch<SetStateAction<Settings>>;

const SettingsContext = React.createContext<{
  settings: Settings;
  setSettings: SetSettings;
}>({
  settings: baseSettings,
  setSettings: () => {},
});

const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState(baseSettings);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

const useSettings = () => {
  return React.useContext(SettingsContext);
};

export type { Settings, SetSettings };
export { useSettings, SettingsProvider };
