import {
  AnnotationInfo,
  Interval,
  useAnnotations,
} from "../contexts/Annotations";
import { getTextAnnotationMidpoints, spanIDcomparator } from "./Canvas/actions";

import { MutableRefObject } from "react";
import { TextField } from "@mui/material";
import _ from "lodash";
import clsx from "clsx";
import styles from "../styles/RightMargin.module.css";
import { useSettings } from "../contexts/Settings";

const RightMargin = ({
  canvasContainerRef,
  rightMarginRef,
}: {
  canvasContainerRef: MutableRefObject<HTMLDivElement>;
  rightMarginRef: MutableRefObject<HTMLDivElement>;
}) => {
  const { settings } = useSettings();
  const { annotations, setAnnotations } = useAnnotations();

  const changeTextValue = (event: React.ChangeEvent<HTMLInputElement>) => {
    /* JavaScript does not have a good built-in data type for a Map type that can order by keys,
        as such we use the Map data type to store objects. However, object comparison in JavaScript
        always returns false, and we have to use the isEqual implementation from lodash instead. 
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
      highlightsArray.sort(([aInterval, aInfo], [bInterval, bInfo]) => {
        const startComparator = spanIDcomparator(
          aInterval.start,
          bInterval.start
        );
        if (startComparator !== 0) return startComparator;
        return spanIDcomparator(aInterval.end, bInterval.end);
      });
      const highlights = new Map(highlightsArray);

      return { ...previous, highlights };
    });
  };

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
                onChange={changeTextValue}
                id={JSON.stringify(item.interval)}
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
