import {
  amber,
  blue,
  blueGrey,
  brown,
  cyan,
  deepOrange,
  deepPurple,
  green,
  indigo,
  lightBlue,
  lightGreen,
  lime,
  orange,
  pink,
  purple,
  red,
  teal,
  yellow,
} from "@mui/material/colors";

import clsx from "clsx";
import styles from "../../styles/Swatch/Swatch.module.css";
import { useAnnotations } from "../../contexts/Annotations";
import { useSettings } from "../../contexts/Settings";

const colours = [
  red["500"],
  pink["500"],
  purple["500"],
  deepPurple["500"],
  indigo["500"],
  blue["500"],
  lightBlue["500"],
  cyan["500"],
  teal["500"],
  green["500"],
  lightGreen["500"],
  lime["500"],
  yellow["500"],
  amber["500"],
  orange["500"],
  deepOrange["500"],
  brown["500"],
  blueGrey["500"],
];

const Circle = ({
  colour,
  selected,
}: {
  colour: string;
  selected: boolean;
}) => {
  const { annotations, setAnnotations } = useAnnotations();
  const { settings } = useSettings();
  const changeActiveColour = (colour: string) => {
    setAnnotations((previous) => {
      return { ...previous, activeColour: colour };
    });
  };
  const highlightText = (colour: string) => {
    setAnnotations((previous) => {
      let newHighlights = new Map(previous.highlights);
      newHighlights.set(
        { start: previous.selection.start, end: previous.selection.end },
        { colour: colour, text: "" }
      );
      return {
        ...previous,
        highlights: newHighlights,
        activeColour: colour,
      };
    });
  };
  const style = { backgroundColor: `${colour}` };
  return (
    <span>
      <div
        style={style}
        className={clsx(styles.circle, {
          [styles.selected]: selected,
          [styles.selectedLight]: selected && !settings.isDarkMode,
          [styles.selectedDark]: selected && settings.isDarkMode,
        })}
        onClick={() => {
          changeActiveColour(colour);
          if (!annotations.isPainterMode) highlightText(colour);
        }}
      />
    </span>
  );
};

const Swatch = () => {
  const { annotations } = useAnnotations();
  const isSelectedArray = colours.map(
    (colour) => colour === annotations.activeColour
  );

  return (
    <div className={styles.swatch}>
      {colours.map((colour, index) => (
        <Circle colour={colour} selected={isSelectedArray[index]} key={index} />
      ))}
    </div>
  );
};

export { Swatch };
