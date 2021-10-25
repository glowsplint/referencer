// import { useMediaQuery } from "@mui/material";
import React, { SetStateAction, useState } from "react";

export type Settings = {
  isLayersOn: boolean;
  isSettingsOpen: boolean;
  isDarkMode: boolean;
  isMultipleRowsLayout: boolean;
  isJustified: boolean;
};

const baseSettings = {
  isLayersOn: true,
  isSettingsOpen: true,
  //   isDarkMode: useMediaQuery("(prefers-color-scheme: dark)"),
  isDarkMode: false,
  isMultipleRowsLayout: true,
  isJustified: true,
};

export type SetSettings = React.Dispatch<SetStateAction<Settings>>;

const SettingsContext = React.createContext<{
  settings: Settings;
  setSettings: SetSettings;
}>({
  settings: baseSettings,
  setSettings: () => {},
});

export const SettingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [settings, setSettings] = useState(baseSettings);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  return React.useContext(SettingsContext);
};
