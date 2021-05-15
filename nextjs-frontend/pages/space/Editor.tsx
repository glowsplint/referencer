import React from "react";
import styles from "./Editor.module.css";
import DesktopWindowsIcon from "@material-ui/icons/DesktopWindows";
import ZoomInIcon from "@material-ui/icons/ZoomIn";
import ZoomOutIcon from "@material-ui/icons/ZoomOut";
import HelpIcon from "@material-ui/icons/Help";

export default function App() {
  return (
    <div className={styles.editor}>
      <div className={styles.editor_header}>
        <div className={styles.editor_header_left}>
          <DesktopWindowsIcon />
          <div className={styles.header_left_text}>Your Workspace</div>
        </div>

        <div className={styles.editor_header_right}>
          <ZoomInIcon />
          <ZoomOutIcon />
          <HelpIcon />
        </div>
      </div>

      <div className={styles.editor_textarea}>Text Area</div>
    </div>
  );
}
