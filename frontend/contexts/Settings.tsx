import React, { useState } from "react";
import { SetSettings, Settings } from "../components/types";

const baseSettings = {
  isDarkMode: false,
  isZenMode: false,
  isJustified: true,
  isLayersOn: true,
  isMultipleRowsLayout: true,
  isSettingsOpen: true,
};

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

export { useSettings, SettingsProvider };
