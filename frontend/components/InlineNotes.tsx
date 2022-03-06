import _ from 'lodash';
import styles from '../styles/InlineNotes.module.css';
import { getIntervalMidpoint } from './Canvas/actions';
import { useAnnotations } from '../contexts/Annotations';
import {
  Interval,
  IntervalString,
  SetAnnotations,
  SpanID,
} from "../common/types";
import {
  MutableRefObject,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";


const verticalOffset = -1.8; // in em units

const Chip = ({
  canvasContainer,
  id,
  interval,
  onValueChange,
  setWidthValue,
  value,
  width,
}: {
  canvasContainer: MutableRefObject<HTMLDivElement>;
  id: string;
  interval: Interval;
  onValueChange: React.FormEventHandler;
  setWidthValue: (newValue: number) => void;
  value: string;
  width: number;
}) => {
  const [input, setInput] = useState("");
  const ref = useRef<HTMLInputElement>() as RefObject<HTMLInputElement>;

  const rect = getIntervalMidpoint(canvasContainer, interval);
  const horizontalOffset = -width / 2; // in px units
  let style = {
    // 1. Shift up vertically by an offset
    // 2. Shift left horizontally to align midpoint of chip with midpoint of selection
    transform: `translateX(${rect.x + horizontalOffset}px) translateY(calc(${
      rect.y
    }px + ${verticalOffset}em))`,
  };

  useEffect(() => {
    // Creates a fake element with the same styles to correctly update the width
    // of the text field
    const fakeEle = document.createElement("div");
    fakeEle.style.position = "absolute";
    fakeEle.style.top = "0";
    fakeEle.style.left = "-9999px";
    fakeEle.style.overflow = "hidden";
    fakeEle.style.visibility = "hidden";
    fakeEle.style.whiteSpace = "nowrap";
    fakeEle.style.height = "0";

    // Get the styles
    const textElementStyle = window.getComputedStyle(ref.current as Element);

    // Copy font styles from the textbox
    fakeEle.style.fontFamily = textElementStyle.fontFamily;
    fakeEle.style.fontSize = textElementStyle.fontSize;
    fakeEle.style.fontStyle = textElementStyle.fontStyle;
    fakeEle.style.fontWeight = textElementStyle.fontWeight;
    fakeEle.style.letterSpacing = textElementStyle.letterSpacing;
    fakeEle.style.textTransform = textElementStyle.textTransform;

    fakeEle.style.borderLeftWidth = textElementStyle.borderLeftWidth;
    fakeEle.style.borderRightWidth = textElementStyle.borderRightWidth;
    fakeEle.style.paddingLeft = textElementStyle.paddingLeft;
    fakeEle.style.paddingRight = textElementStyle.paddingRight;

    const string = input || "";
    fakeEle.innerHTML = string.replace(/\s/g, "&" + "nbsp;");
    const fakeEleStyles = window.getComputedStyle(fakeEle);
    document.body.appendChild(fakeEle);
    setWidthValue(
      Number(fakeEleStyles.width.substring(0, fakeEleStyles.width.length - 2))
    );

    return () => {
      document.body.removeChild(fakeEle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  return (
    <input
      ref={ref}
      type="text"
      autoComplete="off"
      style={{ ...style, width }}
      className={styles.chip}
      onInput={(event) => {
        setInput((event.target as HTMLTextAreaElement).value);
        onValueChange(event);
      }}
      id={id}
    />
  );
};

const InlineNotes = ({
  canvasContainer,
}: {
  canvasContainer: MutableRefObject<HTMLDivElement>;
}) => {
  const { annotations, setAnnotations } = useAnnotations();
  const [widths, setWidths] = useState<Map<string, number>>(new Map());

  const ref = useCallback(
    (node: HTMLDivElement) => {
      if (node == null) return;
      // The following callback within setTimeout is called when a new inline note is mounted
      setTimeout(() => {
        setWidths((previous) => {
          const newWidths: Map<string, number> = new Map();
          for (let child of node.children) {
            newWidths.set(child.id, child.getBoundingClientRect().width);
          }
          return newWidths;
        });
      }, 0);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [annotations.highlights]
  );

  const setWidthFromIndex = (
    intervalString: IntervalString,
    newValue: number
  ) => {
    // funky behaviour because of the way this function works
    // widths as a variable should probably be a map of intervalStrings to numbers
    setWidths((previous) => {
      const newWidths = new Map(previous);
      newWidths.set(intervalString, newValue);
      return newWidths;
    });
  };

  const highlights = [...annotations.highlights];

  return (
    <div ref={ref}>
      {highlights.map(([intervalString, info]) => {
        const interval = JSON.parse(intervalString) as Interval;
        return (
          <Chip
            interval={interval}
            canvasContainer={canvasContainer}
            width={widths.get(intervalString) as number}
            setWidthValue={(newValue: number) =>
              setWidthFromIndex(intervalString, newValue)
            }
            key={JSON.stringify(interval)}
            id={JSON.stringify(interval)}
            value={info.text}
            onValueChange={(event) => {
              const newValue = (event.target as HTMLTextAreaElement).value;
              const id = JSON.parse((event.target as HTMLTextAreaElement).id);
              updateTextInHighlights(setAnnotations, newValue, id);
            }}
          />
        );
      })}
    </div>
  );
};

const updateTextInHighlights = (
  setAnnotations: SetAnnotations,
  newValue: string,
  id: [SpanID, SpanID]
) => {
  // setAnnotations((previous) => {
  // // Update text key
  // const prevHighlights = [...previous.highlights];
  // const isIntervalEqual = (
  //   highlightKey: [Interval, AnnotationInfo],
  //   id: [number, number][]
  // ) => {
  //   const [interval, info] = highlightKey;
  //   return _.isEqual([interval.start, interval.end], id);
  // };
  // const matchedItem = prevHighlights.filter((highlightKey) =>
  //   isIntervalEqual(highlightKey, id)
  // )[0];
  // matchedItem[1] = { ...matchedItem[1], text: newValue };
  // const unmatchedItems = prevHighlights.filter(
  //   (highlightKey) => !isIntervalEqual(highlightKey, id)
  // );
  // const highlightsArray = [...unmatchedItems, matchedItem];
  // highlightsArray.sort(highlightsComparator);
  // const newHighlights = new Map(highlightsArray);
  // return { ...previous, highlights: newHighlights };
  // });
};

export { InlineNotes };
