import {
  Interval,
  NaNInterval,
  SetAnnotations,
} from "../../contexts/Annotations";
import { SetTracking, SpanID } from "../../contexts/Tracking";

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

const getParentBoundingRect = () => {
  // Gets the bounding rectangle of the parent container
  return (
    document.getElementById("canvasContainer") as HTMLElement
  ).getBoundingClientRect();
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

const getSelectionBoundingRect = (currentSelection: Interval): DOMRect[] => {
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

const getSelectionOffsetBoundingRect = (current: Interval) => {
  // Compensate the bounding rect with position of canvasContainer with viewport
  const parent = getParentBoundingRect();
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

const sortSpanIDs = (spanIDArray: [SpanID, SpanID]) => {
  const sortedArray = spanIDArray.sort(
    (a, b) => convertSpanIDtoNumber(a) - convertSpanIDtoNumber(b)
  );
  return { start: sortedArray[0], end: sortedArray[1] };
};

/* Tracking */
const setTrackingMode = (
  selectionMode: SelectionMode,
  setTracking: SetTracking
) => {
  setTracking((prevTracking) => {
    const condition = prevTracking.mode.current === selectionMode;
    return {
      ...prevTracking,
      mode: {
        current: selectionMode,
        previous: condition
          ? prevTracking.mode.previous
          : prevTracking.mode.current,
      },
    };
  });
};

/* Selection */
const setSelectionAnchor = (target: SpanID, setAnnotations: SetAnnotations) => {
  setAnnotations((prevAnnotations) => {
    return {
      ...prevAnnotations,
      selection: {
        ...prevAnnotations.selection,
        anchor: target,
      },
    };
  });
};

const setSelectionWithSort = (
  target: SpanID,
  setAnnotations: SetAnnotations
) => {
  setAnnotations((prevAnnotations) => {
    const { start, end } = sortSpanIDs([
      prevAnnotations.selection.anchor as SpanID,
      target as SpanID,
    ]);
    return {
      ...prevAnnotations,
      selection: { ...prevAnnotations.selection, start, end },
    };
  });
};

/* Arrowing */
const setArrowAnchor = (target: SpanID, setAnnotations: SetAnnotations) => {
  setAnnotations((prevAnnotations) => {
    return {
      ...prevAnnotations,
      arrows: {
        ...prevAnnotations.arrows,
        inCreation: {
          anchor: { start: target, end: target },
          target: { start: target, end: target },
          colour: prevAnnotations.activeColour,
        },
      },
    };
  });
};

const setArrowTarget = (target: SpanID, setAnnotations: SetAnnotations) => {
  // Current implementation: Set both start and end to the same target
  // This only allows for single-word to single-word arrows
  setAnnotations((prevAnnotations) => {
    return {
      ...prevAnnotations,
      arrows: {
        ...prevAnnotations.arrows,
        inCreation: {
          ...prevAnnotations.arrows.inCreation,
          target: { start: target, end: target },
        },
      },
    };
  });
};

const finaliseArrowCreation = (setAnnotations: SetAnnotations) => {
  // Current implementation: Set both start and end to the same target
  // This only allows for single-word to single-word arrows
  setAnnotations((prevAnnotations) => {
    return {
      ...prevAnnotations,
      arrows: {
        inCreation: {
          anchor: { start: NaNInterval, end: NaNInterval },
          target: { start: NaNInterval, end: NaNInterval },
          colour: prevAnnotations.activeColour,
        },
        finished: [
          ...prevAnnotations.arrows.finished,
          prevAnnotations.arrows.inCreation,
        ],
      },
    };
  });
};

/* Notes */
const setNotes = (target: SpanID, setAnnotations: SetAnnotations) => {
  setAnnotations((prevAnnotations) => {
    return {
      ...prevAnnotations,
      notes: {
        ...prevAnnotations.notes,
        inCreation: { interval: { start: target, end: target }, text: "" },
      },
    };
  });
};

export {
  setSelectionAnchor,
  setSelectionWithSort,
  setArrowAnchor,
  setArrowTarget,
  finaliseArrowCreation,
  setTrackingMode,
  getAttributes,
  getSelectionOffsetBoundingRect,
};
