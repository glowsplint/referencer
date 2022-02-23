import _ from 'lodash';
import clsx from 'clsx';
import styles from '../styles/RightMargin.module.css';
import { AnnotationInfo, Interval } from './types';
import { TextField } from '@mui/material';
import { useAnnotations } from '../contexts/Annotations';
import { useSettings } from '../contexts/Settings';
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  getTextAnnotationMidpoints,
  highlightsComparator,
} from "./Canvas/actions";

const RightMargin = ({
  canvasContainerRef,
  rightMarginRef,
}: {
  canvasContainerRef: MutableRefObject<HTMLDivElement>;
  rightMarginRef: MutableRefObject<HTMLDivElement>;
}) => {
  const { settings } = useSettings();
  const { annotations, setAnnotations } = useAnnotations();
  const midpoints = getTextAnnotationMidpoints(canvasContainerRef, annotations);
  const [heights, setHeights] = useState<number[]>([]);

  const ref = useCallback(
    (node: HTMLDivElement) => {
      if (node == null) return;
      setTimeout(() => {
        setHeights((previous) => {
          return [...node.children].map(
            (child) => child.getBoundingClientRect().height
          );
        });
      }, 0);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [annotations.highlights]
  );

  const changeTextValue = (event: React.ChangeEvent<HTMLInputElement>) => {
    /* JavaScript does not have a good built-in data type for a Map type that can order by keys,
        as such we use the Map data type to store objects. However, object comparison in JavaScript
        always returns false, and we use the isEqual implementation from lodash instead. 
    */
    event.preventDefault();
    const interval = JSON.parse(event.target.id);

    setAnnotations((previous) => {
      /* The array is sorted before conversion into the Map data type. */
      const previousEntry = [...previous.highlights].filter(([key, value]) =>
        _.isEqual(key, interval)
      )[0];
      const otherEntries = [...previous.highlights].filter(
        ([key, value]) => !_.isEqual(key, interval)
      );
      const highlightsArray = [
        ...otherEntries,
        [
          interval,
          { text: event.target.value, colour: previousEntry[1].colour },
        ] as [Interval, AnnotationInfo],
      ];
      highlightsArray.sort(highlightsComparator);
      const highlights = new Map(highlightsArray);

      return { ...previous, highlights };
    });
  };

  const computeY = (y: number, height: number) => {
    /* Computes the appropriate vertical offset for the textField component by
       accounting for the height of the rendered textField component to match
       the vertical mid-point of the highlight to the vertical mid-point of the
       textField component
    */
    return y - height / 2;
  };

  // Conditionally renders text fields if canvas container ref is valid
  const textFields = canvasContainerRef.current
    ? midpoints.map((item, index) => {
        return (
          <div
            className={styles.textFieldContainer}
            key={index}
            style={{
              transform: `translateY(${computeY(item.y, heights[index])}px)`,
            }}
          >
            <TextField
              value={item.text}
              fullWidth
              multiline
              onChange={changeTextValue}
              id={JSON.stringify(item.interval)}
            />
          </div>
        );
      })
    : null;

  return (
    <div
      ref={rightMarginRef}
      className={clsx(styles.rightMargin, {
        [styles.light]: !settings.isDarkMode,
        [styles.dark]: settings.isDarkMode,
      })}
    >
      <div ref={ref}>{textFields}</div>
    </div>
  );
};

export default RightMargin;
