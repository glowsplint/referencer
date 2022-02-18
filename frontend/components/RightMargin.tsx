import { MutableRefObject } from "react";
import { TextField } from "@mui/material";
import clsx from "clsx";
import { getTextAnnotationMidpoints } from "./Canvas/actions";
import styles from "../styles/RightMargin.module.css";
import { useAnnotations } from "../contexts/Annotations";
import { useSettings } from "../contexts/Settings";

const RightMargin = ({
  canvasContainerRef,
  rightMarginRef,
}: {
  canvasContainerRef: MutableRefObject<HTMLDivElement>;
  rightMarginRef: MutableRefObject<HTMLDivElement>;
}) => {
  const { settings } = useSettings();
  const { annotations } = useAnnotations();

  // Conditionally renders text fields if canvas container ref is valid
  const textFields = canvasContainerRef.current
    ? getTextAnnotationMidpoints(canvasContainerRef, annotations).map(
        (item, index) => {
          return (
            <div className={styles.textField} key={index}>
              <TextField
                value={item.text}
                fullWidth
                style={{ transform: `translateY(${item.y}px)` }}
              />
            </div>
          );
        }
      )
    : null;

  return (
    <div
      ref={rightMarginRef}
      className={clsx(styles.rightMargin, {
        [styles.light]: !settings.isDarkMode,
        [styles.dark]: settings.isDarkMode,
      })}
    >
      {textFields}
    </div>
  );
};

export default RightMargin;
