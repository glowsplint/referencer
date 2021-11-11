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
  ({
    icon,
    callback,
    buttonProps = {},
  }: {
    icon: JSX.Element;
    callback: () => void;
    buttonProps: object;
  }) => {
    return (
      <div className={styles.leftpane_icon} onClick={callback} {...buttonProps}>
        <Fab size="small" color="primary" aria-label="add">
          {icon}
        </Fab>
      </div>
    );
  }
);

const SwitchingButtonIcon = ({
  iconOne,
  iconTwo,
  bool,
  callback,
  title,
  buttonProps = {},
}: {
  iconOne: JSX.Element;
  iconTwo: JSX.Element;
  bool: boolean;
  callback: () => void;
  title: string;
  buttonProps: object;
}) => {
  return (
    <div className={styles.leftpane_icon} {...buttonProps} onClick={callback}>
      <Tooltip title={title} placement="right">
        <Fab size="small" color="primary" aria-label="add">
          {bool ? iconOne : iconTwo}
        </Fab>
      </Tooltip>
    </div>
  );
};

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
    <Paper className={styles.leftpane} data-testid="buttonPane">
      <ButtonIcon
        icon={<MenuIcon />}
        callback={toggleSettingsPane}
        buttonProps={{ "data-testid": "menuButton" }}
      />
      <SwitchingButtonIcon
        iconOne={<InvertColorsOffIcon />}
        iconTwo={<InvertColorsIcon />}
        bool={settings.isDarkMode}
        callback={toggleDarkMode}
        title="Toggle dark mode"
        buttonProps={{ "data-testid": "darkModeButton" }}
      />
      <SwitchingButtonIcon
        iconOne={<LayersClearIcon />}
        iconTwo={<LayersIcon />}
        bool={settings.isLayersOn}
        callback={toggleLayers}
        title="Toggle layer visibility"
        buttonProps={{ "data-testid": "clearLayersButton" }}
      />
      <SwitchingButtonIcon
        iconTwo={<TextRotationNoneIcon />}
        iconOne={<TextRotateVerticalIcon />}
        bool={settings.isMultipleRowsLayout}
        callback={toggleEditorLayout}
        title="Toggle editor layout"
        buttonProps={{ "data-testid": "editorLayoutButton" }}
      />
      <SwitchingButtonIcon
        iconOne={<FormatAlignLeftIcon />}
        iconTwo={<FormatAlignJustifyIcon />}
        bool={settings.isJustified}
        callback={toggleJustify}
        title="Toggle left-align/justify"
        buttonProps={{ "data-testid": "textAlignButton" }}
      />
    </Paper>
  );
});

export default ButtonPane;
