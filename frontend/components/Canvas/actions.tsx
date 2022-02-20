import {
  AnnotationInfo,
  Annotations,
  Interval,
  SetAnnotations,
  baseAnnotations,
} from "../../contexts/Annotations";
import { SetTracking, SpanID } from "../../contexts/Tracking";

import { MutableRefObject } from "react";
import { SelectionMode } from "../../common/enums";

// Types and interfaces
type BoundingBox = {
  width: number;
  height: number;
  x: number;
  y: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
};

// Helper functions
const SPAN_LEVEL = 3;

const getSpan = (x: number, y: number) => {
  return document.elementsFromPoint(x, y)[SPAN_LEVEL];
};

const getCurrentSpanAttributes = (span: Element) => {
  // Get <span>'s data-index attribute to update Highlight context
  const getDataIndex = () => {
    const spanIDString = (span as HTMLElement).id;
    const spanID = spanIDString
      ?.split(",")
      .map((item) => Number(item)) as SpanID;
    return spanID;
  };

  return { target: getDataIndex() };
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
  return canvasContainer.current.getBoundingClientRect();
};

const getSelectedNodes = (
  startNode: HTMLElement,
  endNode: HTMLElement
): Element[] => {
  // Gets all the nodes between two spans (inclusive)
  const children = Array.from(startNode?.parentElement?.children ?? []);
  const startIndex = children.findIndex((item) => item.id === startNode.id);
  const endIndex = children.findIndex((item) => item.id === endNode?.id);
  return children.slice(startIndex, endIndex + 1);
};

const getSelectionBoundingRect = (currentSelection: Interval) => {
  // Gets all bounding rectangles for a given selection
  const getNode = (key: "start" | "end") =>
    document.getElementById(`${currentSelection[key]?.toString()}`);
  const startNode = getNode("start") as HTMLElement;
  const endNode = getNode("end") as HTMLElement;

  /* We create bounding rectangles for all spans between the start and the end.
    
       We can combine all bounding boxes with the same y level if they have the same
       textAreaID to reduce the number of drawn rectangles. This is not currently
       implemented. */

  // Get all the nodes in between the start and end node
  const selectedNodes = getSelectedNodes(startNode, endNode);
  return selectedNodes.map((node) => node.getBoundingClientRect());
};

const getSelectionOffsetBoundingRect = (
  canvasContainer: MutableRefObject<HTMLDivElement>,
  current: Interval
) => {
  /* Returns the array of bounding rectangles for every item in the Interval,
     offset by the bounding rect with position of canvasContainer with viewport */
  const parent = getParentBoundingRect(canvasContainer);
  return getSelectionBoundingRect(current)
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
      return Object.entries(rect).some(([_key, value]) => value == null)
        ? null
        : rect;
    })
    .filter((item) => item) as BoundingBox[];
};

const getMidpointFromDOMRect = (domRect: DOMRect): [number, number] => {
  return [domRect.x + domRect.width / 2, domRect.y + domRect.height / 2];
};

const getCoordsFromSpanID = (span: SpanID): [number, number] => {
  const element = document.getElementById(span.toString()) as HTMLElement;
  return getMidpointFromDOMRect(element.getBoundingClientRect());
};

const convertSpanIDtoNumber = (spanID: SpanID) => {
  return (
    spanID[0] * 1_000_000_000 +
    spanID[1] * 1_000_000 +
    spanID[2] * 1_000 +
    spanID[3]
  );
};

const spanIDcomparator = (a: SpanID, b: SpanID) =>
  convertSpanIDtoNumber(a) - convertSpanIDtoNumber(b);

const sortSpanIDs = (spanIDArray: [SpanID, SpanID]) => {
  const sortedArray = spanIDArray.sort(spanIDcomparator);
  return { start: sortedArray[0], end: sortedArray[1] };
};

/* Tracking */
const setTrackingMode = (
  selectionMode: SelectionMode,
  setTracking: SetTracking
) => {
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
  // Sets the current selection into the annotation context
  setAnnotations((previous) => {
    const { start, end } = sortSpanIDs([
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
  setAnnotations((previous) => {
    return { ...previous, selection: { ...previous.selection, text: "" } };
  });
};

/* Arrowing */
const setArrowAnchor = (target: SpanID, setAnnotations: SetAnnotations) => {
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

const pushSelectionToHighlight = (setAnnotations: SetAnnotations) => {
  setAnnotations((previous) => {
    const highlights = new Map([
      ...previous.highlights,
      [
        previous.selection,
        {
          colour: previous.activeColour,
          text: "",
        },
      ],
    ]);
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
    return {
      ...previous,
      arrows: {
        inCreation: baseAnnotations.arrows.inCreation,
        finished: new Map([
          ...previous.arrows.finished,
          [
            { anchor, target },
            { colour, text: "" },
          ],
        ]),
      },
    };
  });
};

/* Text annotations */
const getIntervalMidpoint = (
  canvasContainer: MutableRefObject<HTMLDivElement>,
  interval: Interval
) => {
  /* Returns the y-coordinate of the midpoint from an interval */
  const boxes = getSelectionOffsetBoundingRect(canvasContainer, interval);
  // if (boxes.length === 0) return;
  const getYProperty = (func: (...values: number[]) => number) =>
    boxes
      .map((box) => box.y)
      .reduce((previousY, currentY) => func(previousY, currentY));
  const minY = getYProperty(Math.min);
  const maxY = getYProperty(Math.max);
  const maxYWidth = boxes
    .filter((box) => box.y === maxY)
    .map((box) => box.height)
    .reduce((previousY, currentY) => Math.max(previousY, currentY));
  return (minY + maxY + maxYWidth) / 2;
};

const getTextAnnotationMidpoints = (
  canvasContainer: MutableRefObject<HTMLDivElement>,
  annotations: Annotations
) => {
  /* Returns the y-coordinate midpoints from current highlights and selection */
  const highlights = [...annotations.highlights];

  return (highlights.filter(Boolean) as [Interval, AnnotationInfo][]).map(
    ([interval, annotationInfo]) => {
      return {
        y: getIntervalMidpoint(canvasContainer, interval),
        ...annotationInfo,
        interval,
      };
    }
  );
};

export {
  finaliseArrowCreation,
  getAttributes,
  getSelectionOffsetBoundingRect,
  getTextAnnotationMidpoints,
  pushSelectionToHighlight,
  setArrowAnchor,
  setArrowTarget,
  setSelectionAnchor,
  setSelectionEmptyText,
  setSelectionWithSort,
  setTrackingMode,
  spanIDcomparator,
};
