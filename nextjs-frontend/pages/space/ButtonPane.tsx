import styles from "../../styles/ButtonPane.module.css";
import Fab from "@material-ui/core/Fab";

import MenuIcon from "@material-ui/icons/Menu";
import InvertColorsIcon from "@material-ui/icons/InvertColors";
import InvertColorsOffIcon from "@material-ui/icons/InvertColorsOff";
import LayersIcon from "@material-ui/icons/Layers";
import LayersClearIcon from "@material-ui/icons/LayersClear";
import TextRotateVerticalIcon from "@material-ui/icons/TextRotateVertical";
import TextRotationNoneIcon from "@material-ui/icons/TextRotationNone";

function ButtonIcon({ icon, callback }: { icon: JSX.Element; callback }) {
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
}: {
  iconOne: JSX.Element;
  iconTwo: JSX.Element;
  bool: boolean;
  callback;
}) {
  return (
    <div className={styles.leftpane_icon}>
      <Fab size="small" color="primary" aria-label="add" onClick={callback}>
        {bool ? iconOne : iconTwo}
      </Fab>
    </div>
  );
}

export default function ButtonPane({
  toggleSettingsPane,
  toggleDarkMode,
  toggleLayers,
  toggleEditorLayout,
  isDarkMode,
  isLayersOn,
  isMultipleRowsLayout,
}: {
  toggleSettingsPane;
  toggleDarkMode;
  toggleLayers;
  toggleEditorLayout;
  isDarkMode: boolean;
  isLayersOn: boolean;
  isMultipleRowsLayout: boolean;
}) {
  return (
    <div className={styles.leftpane}>
      <ButtonIcon icon={<MenuIcon />} callback={toggleSettingsPane} />
      <SwitchingButtonIcon
        iconOne={<InvertColorsIcon />}
        iconTwo={<InvertColorsOffIcon />}
        bool={isDarkMode}
        callback={toggleDarkMode}
      />
      <SwitchingButtonIcon
        iconOne={<LayersIcon />}
        iconTwo={<LayersClearIcon />}
        bool={isLayersOn}
        callback={toggleLayers}
      />
      <SwitchingButtonIcon
        iconOne={<TextRotationNoneIcon />}
        iconTwo={<TextRotateVerticalIcon />}
        bool={isMultipleRowsLayout}
        callback={toggleEditorLayout}
      />
    </div>
  );
}
