import Fab from "@mui/material/Fab";
import FormatAlignJustifyIcon from "@mui/icons-material/FormatAlignJustify";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import InvertColorsIcon from "@mui/icons-material/InvertColors";
import InvertColorsOffIcon from "@mui/icons-material/InvertColorsOff";
import LayersClearIcon from "@mui/icons-material/LayersClear";
import LayersIcon from "@mui/icons-material/Layers";
import MenuIcon from "@mui/icons-material/Menu";
import Paper from "@mui/material/Paper";
import React from "react";
import TextRotateVerticalIcon from "@mui/icons-material/TextRotateVertical";
import TextRotationNoneIcon from "@mui/icons-material/TextRotationNone";
import Tooltip from "@mui/material/Tooltip";
import styles from "../styles/ButtonPane.module.css";
import { useSettings } from "../contexts/Settings";

const ButtonIcon = React.memo(
  ({ icon, callback }: { icon: JSX.Element; callback: () => void }) => {
    return (
      <div className={styles.leftpane_icon}>
        <Fab size="small" color="primary" aria-label="add" onClick={callback}>
          {icon}
        </Fab>
      </div>
    );
  }
);

const SwitchingButtonIcon = React.memo(
  ({
    iconOne,
    iconTwo,
    bool,
    callback,
    title,
  }: {
    iconOne: JSX.Element;
    iconTwo: JSX.Element;
    bool: boolean;
    callback: () => void;
    title: string;
  }) => {
    return (
      <div className={styles.leftpane_icon}>
        <Tooltip title={title} placement="right">
          <Fab size="small" color="primary" aria-label="add" onClick={callback}>
            {bool ? iconOne : iconTwo}
          </Fab>
        </Tooltip>
      </div>
    );
  }
);

const ButtonPane = React.memo(() => {
  const { settings, setSettings } = useSettings();
  const toggleSettingsPane = () => {
    setSettings((prevSettings) => {
      return { ...prevSettings, isSettingsOpen: !settings.isSettingsOpen };
    });
  };
  const toggleDarkMode = () => {
    setSettings((prevSettings) => {
      return { ...prevSettings, isDarkMode: !settings.isDarkMode };
    });
  };
  const toggleLayers = () => {
    setSettings((prevSettings) => {
      return { ...prevSettings, isLayersOn: !settings.isLayersOn };
    });
  };
  const toggleEditorLayout = () => {
    setSettings((prevSettings) => {
      return {
        ...prevSettings,
        isMultipleRowsLayout: !settings.isMultipleRowsLayout,
      };
    });
  };
  const toggleJustify = (): void => {
    setSettings((prevSettings) => {
      return {
        ...prevSettings,
        isJustified: !settings.isJustified,
      };
    });
  };

  return (
    <Paper className={styles.leftpane}>
      <ButtonIcon icon={<MenuIcon />} callback={toggleSettingsPane} />
      <SwitchingButtonIcon
        iconOne={<InvertColorsOffIcon />}
        iconTwo={<InvertColorsIcon />}
        bool={settings.isDarkMode}
        callback={toggleDarkMode}
        title="Toggle dark mode"
      />
      <SwitchingButtonIcon
        iconOne={<LayersClearIcon />}
        iconTwo={<LayersIcon />}
        bool={settings.isLayersOn}
        callback={toggleLayers}
        title="Toggle visibility of layers"
      />
      <SwitchingButtonIcon
        iconTwo={<TextRotationNoneIcon />}
        iconOne={<TextRotateVerticalIcon />}
        bool={settings.isMultipleRowsLayout}
        callback={toggleEditorLayout}
        title="Toggle editor layout"
      />
      <SwitchingButtonIcon
        iconOne={<FormatAlignLeftIcon />}
        iconTwo={<FormatAlignJustifyIcon />}
        bool={settings.isJustified}
        callback={toggleJustify}
        title="Toggle left-align/justify"
      />
    </Paper>
  );
});

export default ButtonPane;
