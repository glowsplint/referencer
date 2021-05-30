import styles from "../styles/ButtonPane.module.css";
import Fab from "@material-ui/core/Fab";
import Tooltip from "@material-ui/core/Tooltip";

import MenuIcon from "@material-ui/icons/Menu";
import InvertColorsIcon from "@material-ui/icons/InvertColors";
import InvertColorsOffIcon from "@material-ui/icons/InvertColorsOff";
import LayersIcon from "@material-ui/icons/Layers";
import LayersClearIcon from "@material-ui/icons/LayersClear";
import TextRotateVerticalIcon from "@material-ui/icons/TextRotateVertical";
import TextRotationNoneIcon from "@material-ui/icons/TextRotationNone";
import FormatAlignLeftIcon from "@material-ui/icons/FormatAlignLeft";
import FormatAlignJustifyIcon from "@material-ui/icons/FormatAlignJustify";

function ButtonIcon({
  icon,
  callback,
}: {
  icon: JSX.Element;
  callback: () => void;
}) {
  return (
    <div className={styles.leftpane_icon}>
      <Fab size="small" color="primary" aria-label="add" onClick={callback}>
        {icon}
      </Fab>
    </div>
  );
}

function SwitchingButtonIcon({
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
}) {
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

export default function ButtonPane({
  settings,
  toggleSettingsPane,
  toggleDarkMode,
  toggleLayers,
  toggleEditorLayout,
  toggleJustify,
}: {
  settings: {
    isLayersOn: boolean;
    isSettingsOpen: boolean;
    isDarkMode: boolean;
    isMultipleRowsLayout: boolean;
    isJustified: boolean;
  };
  toggleSettingsPane: () => void;
  toggleDarkMode: () => void;
  toggleLayers: () => void;
  toggleEditorLayout: () => void;
  toggleJustify: () => void;
}) {
  return (
    <div className={styles.leftpane}>
      <ButtonIcon icon={<MenuIcon />} callback={toggleSettingsPane} />
      <SwitchingButtonIcon
        iconOne={<InvertColorsIcon />}
        iconTwo={<InvertColorsOffIcon />}
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
        iconTwo={<FormatAlignJustifyIcon />}
        iconOne={<FormatAlignLeftIcon />}
        bool={settings.isJustified}
        callback={toggleJustify}
        title="Toggle left-align/justify"
      />
    </div>
  );
}
