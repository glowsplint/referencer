import styles from '../styles/InlineNotes.module.css';
import { useAnnotations } from '../contexts/Annotations';
import {
  CSSProperties,
  MutableRefObject,
  useCallback,
  useRef,
  useState,
} from "react";
import {
  getIntervalMidpoint,
  getSelectionOffsetBoundingRect,
} from "./Canvas/actions";


const verticalOffset = -1.7; // in em units

const Chip = ({ label, style }: { label: string; style?: CSSProperties }) => {
  const [height, setHeight] = useState();
  return (
    <div className={styles.chip} style={style}>
      {label}
    </div>
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
  return (
    <div ref={ref}>
      {[...annotations.highlights].map(([interval, info], index) => {
        const horizontalOffset = -widths[index] / 2; // in px units
        const rect = getIntervalMidpoint(canvasContainer, interval);

        const style = {
          // 1. Shift up vertically by an offset
          // 2. Shift left horizontally to align midpoint of chip with midpoint of selection
          transform: `translateX(${
            rect.x + horizontalOffset
          }px) translateY(calc(${rect.y}px + ${verticalOffset}em))`,
        };
        return <Chip key={index} style={style} label="meepmorpmorp" />;
      })}
    </div>
  );
};

export { InlineNotes };
