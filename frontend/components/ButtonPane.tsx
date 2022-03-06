import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import Fab from '@mui/material/Fab';
import FormatPaintIcon from '@mui/icons-material/FormatPaint';
import HighlightAltIcon from '@mui/icons-material/HighlightAlt';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import InvertColorsIcon from '@mui/icons-material/InvertColors';
import InvertColorsOffIcon from '@mui/icons-material/InvertColorsOff';
import LayersClearIcon from '@mui/icons-material/LayersClear';
import LayersIcon from '@mui/icons-material/Layers';
import MenuIcon from '@mui/icons-material/Menu';
import Paper from '@mui/material/Paper';
import React from 'react';
import styles from '../styles/ButtonPane.module.css';
import TextRotateVerticalIcon from '@mui/icons-material/TextRotateVertical';
import TextRotationNoneIcon from '@mui/icons-material/TextRotationNone';
import Tooltip from '@mui/material/Tooltip';
import { useAnnotations } from '../contexts/Annotations';
import { useSettings } from '../contexts/Settings';

const ButtonIcon = ({
  icon,
  callback,
  buttonProps = {},
}: {
  icon: JSX.Element;
  callback: () => void;
  buttonProps: object;
}) => {
  return (
    <div className={styles.leftPaneIcon} onClick={callback} {...buttonProps}>
      <Fab size="small" color="primary" aria-label="add">
        {icon}
      </Fab>
    </div>
  );
};

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
    <div className={styles.leftPaneIcon} {...buttonProps} onClick={callback}>
      <Tooltip title={title} placement="right">
        <Fab size="small" color="primary" aria-label="add">
          {bool ? iconOne : iconTwo}
        </Fab>
      </Tooltip>
    </div>
  );
};

const ButtonPane = () => {
  const { settings, setSettings } = useSettings();
  const { annotations, setAnnotations } = useAnnotations();
  const toggleSettingsPane = () => {
    setSettings((previous) => {
      return { ...previous, isSettingsOpen: !settings.isSettingsOpen };
    });
  };
  const toggleDarkMode = () => {
    setSettings((previous) => {
      return { ...previous, isDarkMode: !settings.isDarkMode };
    });
  };
  const toggleLayers = () => {
    setSettings((previous) => {
      return { ...previous, isLayersOn: !settings.isLayersOn };
    });
  };
  const toggleEditorLayout = () => {
    setSettings((previous) => {
      return {
        ...previous,
        isMultipleRowsLayout: !settings.isMultipleRowsLayout,
      };
    });
  };
  const toggleJustify = () => {
    setSettings((previous) => {
      return {
        ...previous,
        isJustified: !settings.isJustified,
      };
    });
  };
  const togglePainterMode = () => {
    setAnnotations((previous) => {
      return {
        ...previous,
        isPainterMode: !annotations.isPainterMode,
      };
    });
  };
  const toggleZenMode = () => {
    const element = document.documentElement;
    element.requestFullscreen().then(() => {
      setSettings((previous) => {
        return {
          ...previous,
          isZenMode: !settings.isZenMode,
        };
      });
    });
  };

  return (
    <Paper className={styles.leftPane} data-testid="buttonPane" square>
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
        iconOne={<HighlightAltIcon />}
        iconTwo={<FormatPaintIcon />}
        bool={annotations.isPainterMode}
        callback={togglePainterMode}
        title="Toggle Painter mode"
        buttonProps={{ "data-testid": "painterModeButton" }}
      />
      <SwitchingButtonIcon
        iconOne={<HighlightOffIcon />}
        iconTwo={<CenterFocusStrongIcon />}
        bool={settings.isZenMode}
        callback={toggleZenMode}
        title="Toggle Zen mode"
        buttonProps={{ "data-testid": "zenModeButton" }}
      />
    </Paper>
  );
};

export default ButtonPane;
