import { baseAnnotations, NaNInterval } from '../../contexts/Annotations';
import { MutableRefObject } from 'react';
import { SelectionMode } from '../../common/constants';
import {
  AnnotationInfo,
  Annotations,
  ArrowIndicesString,
  BoundingBox,
  Interval,
  IntervalString,
  SetAnnotations,
  SetTracking,
  SpanID,
} from "../../common/types";


/* Helper functions */
const SPAN_LEVEL = 3;

const getSpan = (x: number, y: number) => {
  return document.elementsFromPoint(x, y)[SPAN_LEVEL];
};

const getCurrentSpanAttributes = (span: Element) => {
  // Get <span>'s .id attribute to update Highlight context
  const spanIDString = (span as HTMLElement).id;
  const spanID = spanIDString?.split(",").map((item) => Number(item)) as SpanID;
  return { target: spanID };
};

const getAttributes = (x: number, y: number, condition: boolean = false) => {
  const span = getSpan(x, y);
  // Check that we are ending on a word (span), return early otherwise
  const isEarlyReturn = condition || span.tagName.toLowerCase() === "div";
  if (isEarlyReturn) {
    return {
      target: undefined,
      isEarlyReturn: true,
    };
  }
  const { target } = getCurrentSpanAttributes(span);
  return { target, isEarlyReturn };
};

const getParentBoundingRect = (
  canvasContainer: MutableRefObject<HTMLDivElement>
) => {
  // Gets the bounding rectangle of the parent container
  return canvasContainer.current?.getBoundingClientRect();
};

const getSelectedNodes = (
  startNode: HTMLElement,
  endNode: HTMLElement
): Element[] => {
  // Gets all the nodes between two spans (inclusive)
  const children = Array.from(startNode?.parentElement?.children ?? []);
  const startIndex = children.findIndex((item) => item.id === startNode.id);
  const endIndex = children.findIndex((item) => item.id === endNode.id);
  return children.slice(startIndex, endIndex + 1);
};

const getSelectionBoundingRects = (currentSelection: Interval) => {
  // Returns an array of DOMRects for a given interval with start and end SpanIDs
  const getNode = (key: "start" | "end") =>
    document.getElementById(`${currentSelection[key]?.toString()}`);
  const startNode = getNode("start") as HTMLElement;
  const endNode = getNode("end") as HTMLElement;

  /* We create bounding rectangles for all spans between the start and the end.
    
     We can combine all bounding boxes with the same y level if they have the same
     textAreaID to reduce the number of drawn rectangles as an optimisation. This
     is not currently implemented. */

  const selectedNodes = getSelectedNodes(startNode, endNode);
  return selectedNodes.map((node) => node.getBoundingClientRect());
};

const getSelectionOffsetBoundingRects = (
  canvasContainer: MutableRefObject<HTMLDivElement>,
  current: Interval
) => {
  /* Returns the array of bounding rectangles for every item in the Interval,
     offset by the bounding rect with position of canvasContainer with viewport */
  const parent = getParentBoundingRect(canvasContainer);
  return getSelectionBoundingRects(current)
    .map((child) => {
      const rect: BoundingBox = {
        width: child?.width,
        height: child?.height,
        x: child?.x - parent.x,
        y: child?.y - parent.y,
        top: child?.top - parent.top,
        right: child?.right - parent.right,
        bottom: child?.bottom - parent.bottom,
        left: child?.left - parent.left,
      };
      // If any of the object's entries are null or undefined, return null
      return Object.entries(rect).some(([key, value]) => value == null)
        ? null
        : rect;
    })
    .filter(Boolean) as BoundingBox[];
};

const convertSpanIDtoNumber = (spanID: SpanID) => {
  // Returns a single number from a given SpanID
  return (
    spanID[0] * 1_000_000_000 +
    spanID[1] * 1_000_000 +
    spanID[2] * 1_000 +
    spanID[3]
  );
};

const spanIDcomparator = (a: SpanID, b: SpanID) =>
  convertSpanIDtoNumber(a) - convertSpanIDtoNumber(b);

const getSortedSpanIDs = (spanIDArray: [SpanID, SpanID]) => {
  const sortedArray = spanIDArray.sort(spanIDcomparator);
  return { start: sortedArray[0], end: sortedArray[1] };
};

/* Tracking */
const setTrackingMode = (
  selectionMode: SelectionMode,
  setTracking: SetTracking
) => {
  /* Sets tracking.mode.current to <selectionMode> and moves current selection
     to tracking.mode.previous */
  setTracking((previous) => {
    const condition = previous.mode.current === selectionMode;
    return {
      ...previous,
      mode: {
        current: selectionMode,
        previous: condition ? previous.mode.previous : previous.mode.current,
      },
    };
  });
};

/* Selection */
const setSelectionAnchor = (target: SpanID, setAnnotations: SetAnnotations) => {
  // Sets annotations.selection.anchor to <target>
  setAnnotations((previous) => {
    return {
      ...previous,
      selection: {
        ...previous.selection,
        anchor: target,
      },
    };
  });
};

const setSelectionWithSort = (
  target: SpanID,
  setAnnotations: SetAnnotations
) => {
  // Sets annotations.selection to <target>
  setAnnotations((previous) => {
    const { start, end } = getSortedSpanIDs([
      previous.selection.anchor as SpanID,
      target as SpanID,
    ]);
    return {
      ...previous,
      selection: { ...previous.selection, start, end },
    };
  });
};

const setSelectionEmptyText = (setAnnotations: SetAnnotations) => {
  // Sets annotations.selection.text to an empty string
  setAnnotations((previous) => {
    return { ...previous, selection: { ...previous.selection, text: "" } };
  });
};

/* Arrowing */
const setArrowAnchor = (target: SpanID, setAnnotations: SetAnnotations) => {
  // Sets annotations.arrows.inCreation anchor to <target>
  // We also set the target to force the arrow highlight to appear.
  setAnnotations((previous) => {
    return {
      ...previous,
      arrows: {
        ...previous.arrows,
        inCreation: {
          anchor: { start: target, end: target },
          target: { start: target, end: target },
          colour: previous.activeColour,
        },
      },
    };
  });
};

const setArrowTarget = (target: SpanID, setAnnotations: SetAnnotations) => {
  // Current implementation: Set both start and end to the same target
  // This only allows for single-word to single-word arrows
  setAnnotations((previous) => {
    return {
      ...previous,
      arrows: {
        ...previous.arrows,
        inCreation: {
          ...previous.arrows.inCreation,
          target: { start: target, end: target },
        },
      },
    };
  });
};

const changeActiveColour = (colour: string, setAnnotations: SetAnnotations) => {
  // Sets annotations.activeColour to <colour>
  setAnnotations((previous) => {
    return { ...previous, activeColour: colour };
  });
};

const combineHighlights = (
  previousEntries: [IntervalString, AnnotationInfo][],
  newEntry: [IntervalString, AnnotationInfo]
) => {
  /* Combines new entry with previous entries with sorting */
  const highlightsArray = [...previousEntries, newEntry];
  highlightsArray.sort(highlightsComparator);
  return new Map(highlightsArray);
};

const pushSelectionToHighlight = (setAnnotations: SetAnnotations) => {
  setAnnotations((previous) => {
    // Guard clause to prevent errors
    if (
      previous.selection.start == NaNInterval ||
      previous.selection.end == NaNInterval
    )
      return previous;

    const key = JSON.stringify({
      start: previous.selection.start,
      end: previous.selection.end,
    }) as IntervalString;
    const value = { colour: previous.activeColour, text: "" };
    const highlights = combineHighlights(
      [...previous.highlights],
      [key, value]
    );
    return {
      ...previous,
      highlights,
    };
  });
};

const finaliseArrowCreation = (setAnnotations: SetAnnotations) => {
  // Sets both start and end to the same target
  // This currently supports only single-word to single-word arrows
  setAnnotations((previous) => {
    const { anchor, target, colour } = previous.arrows.inCreation;
    const key = JSON.stringify({ anchor, target }) as ArrowIndicesString;
    const value = { colour, text: "" };
    return {
      ...previous,
      arrows: {
        inCreation: baseAnnotations.arrows.inCreation,
        finished: new Map([...previous.arrows.finished, [key, value]]),
      },
    };
  });
};

/* Text annotations */
const highlightsComparator = (
  [aIntervalString, aInfo]: [IntervalString, AnnotationInfo],
  [bIntervalString, bInfo]: [IntervalString, AnnotationInfo]
): number => {
  const aInterval = JSON.parse(aIntervalString) as Interval;
  const bInterval = JSON.parse(bIntervalString) as Interval;
  const startComparator = spanIDcomparator(aInterval.start, bInterval.start);
  if (startComparator !== 0) return startComparator;
  return spanIDcomparator(aInterval.end, bInterval.end);
};

const getIntervalMidpoint = (
  canvasContainer: MutableRefObject<HTMLDivElement>,
  interval: Interval
) => {
  /* Returns the coordinates of the midpoint from an interval, accounting for
     intervals that span across multiple lines
  */
  const boxes = getSelectionOffsetBoundingRects(canvasContainer, interval);
  // Get the horizontal middle by taking the sum of widths for every vertical level
  // and dividing in two, and then running along from the top to see where the middle is
  const totalWidth = boxes.map((box) => box.width).reduce((a, b) => a + b);

  let remainingWidth = totalWidth / 2;
  let i = 0;
  while (remainingWidth - boxes[i].width > 0) {
    remainingWidth -= boxes[i].width;
    i++;
  }

  const x = boxes[i].x + remainingWidth;
  const y = boxes[i].y;
  return { x, y };
};

const getTextAnnotationMidpoints = (
  canvasContainer: MutableRefObject<HTMLDivElement>,
  annotations: Annotations
) => {
  /* Returns the y-coordinate midpoints from current highlights and selection */
  const highlights = [...annotations.highlights];

  return (highlights.filter(Boolean) as [IntervalString, AnnotationInfo][]).map(
    ([intervalString, annotationInfo]) => {
      const interval = JSON.parse(intervalString) as Interval;
      return {
        y: getIntervalMidpoint(canvasContainer, interval).y,
        ...annotationInfo,
        interval: intervalString,
      };
    }
  );
};

export {
  changeActiveColour,
  finaliseArrowCreation,
  getAttributes,
  getIntervalMidpoint,
  getSelectionOffsetBoundingRects,
  getTextAnnotationMidpoints,
  highlightsComparator,
  pushSelectionToHighlight,
  setArrowAnchor,
  setArrowTarget,
  setSelectionAnchor,
  setSelectionEmptyText,
  setSelectionWithSort,
  setTrackingMode,
  spanIDcomparator,
};
