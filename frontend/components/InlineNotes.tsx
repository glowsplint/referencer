import styles from '../styles/InlineNotes.module.css';
import { getIntervalMidpoint } from './Canvas/actions';
import { Interval } from './types';
import { useAnnotations } from '../contexts/Annotations';
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
  horizontalOffset,
  interval,
  width,
  setWidth,
  canvasContainer,
}: {
  horizontalOffset: number;
  interval: Interval;
  width: number;
  setWidth: (newValue: number) => void;
  canvasContainer: MutableRefObject<HTMLDivElement>;
}) => {
  const [input, setInput] = useState("");
  // const [width, setWidth] = useState<string>("");
  const ref = useRef<HTMLInputElement>() as RefObject<HTMLInputElement>;

  const rect = getIntervalMidpoint(canvasContainer, interval);
  let style = {
    // 1. Shift up vertically by an offset
    // 2. Shift left horizontally to align midpoint of chip with midpoint of selection
    transform: `translateX(${rect.x + horizontalOffset}px) translateY(calc(${
      rect.y
    }px + ${verticalOffset}em))`,
  };

  useEffect(() => {
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
    setWidth(
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
      onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
    />
  );
};

const InlineNotes = ({
  canvasContainer,
}: {
  canvasContainer: MutableRefObject<HTMLDivElement>;
}) => {
  const { annotations } = useAnnotations();
  const [widths, setWidths] = useState<number[]>([]);

  const ref = useCallback(
    (node) => {
      if (node == null) return;
      setTimeout(() => {
        setWidths((previous) => {
          return [...node.children].map(
            (child) => child.getBoundingClientRect().width
          );
        });
      }, 0);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [annotations.highlights]
  );

  const setWidth = useCallback((index: number, newValue: number) => {
    setWidths((previous) => {
      let current = [...previous];
      current[index] = newValue;
      return current;
    });
  }, []);

  return (
    <div ref={ref}>
      {[...annotations.highlights].map(([interval, info], index) => {
        const horizontalOffset = -widths[index] / 2; // in px units
        return (
          <Chip
            interval={interval}
            horizontalOffset={horizontalOffset}
            canvasContainer={canvasContainer}
            width={widths[index]}
            setWidth={(newValue: number) => setWidth(index, newValue)}
            key={index}
          />
        );
      })}
    </div>
  );
};

export { InlineNotes };
