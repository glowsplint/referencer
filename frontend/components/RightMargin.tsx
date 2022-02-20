import {
  AnnotationInfo,
  Interval,
  useAnnotations,
} from "../contexts/Annotations";
import { MutableRefObject, useRef, useState } from "react";
import {
  getTextAnnotationMidpoints,
  highlightsComparator,
} from "./Canvas/actions";

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
    // get the height of this text field as an argument into the function
    // console.log(y, height);
    return y - height / 2;
    // return y;
  };

  const midpoints = getTextAnnotationMidpoints(canvasContainerRef, annotations);

  const ref = useRef<HTMLDivElement[]>([]);
  const [heights, setHeights] = useState<number[]>([]);

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
              ref={(element) => {
                ref.current[index] = element as HTMLDivElement;
                // Prevents infinite update loop
                if (heights.length >= ref.current.length) return;
                setHeights((previous) => {
                  // Does not use previous state because multiple renders will chain this callback
                  const latest =
                    ref.current[index]?.getBoundingClientRect().height;
                  return [...heights.slice(0, heights.length), latest];
                });
              }}
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
      {textFields}
    </div>
  );
};

export default RightMargin;
