import clsx from 'clsx';
import styles from '../../styles/Swatch/Swatch.module.css';
import { AnnotationInfo, Interval } from '../types';
import { highlightsComparator } from '../Canvas/actions';
import { NaNInterval, useAnnotations } from '../../contexts/Annotations';
import { useSettings } from '../../contexts/Settings';
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
      // Guard clause to prevent errors
      if (
        previous.selection.start == NaNInterval ||
        previous.selection.end == NaNInterval
      )
        return previous;

      const highlightsArray = [
        ...previous.highlights,
        [
          { start: previous.selection.start, end: previous.selection.end },
          { colour: colour, text: "" },
        ],
      ] as [Interval, AnnotationInfo][];
      highlightsArray.sort(highlightsComparator);
      const highlights = new Map(highlightsArray);
      return {
        ...previous,
        highlights,
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
