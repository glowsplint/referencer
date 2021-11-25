import { Arrow, Layer, Rect, Stage } from "react-konva";
import {
  Indices,
  Interval,
  NaNInterval,
  useAnnotation,
} from "../contexts/Annotations";
import React, { useEffect } from "react";
import {
  SetTracking,
  SpanID,
  baseTracking,
  useTracking,
} from "../contexts/Tracking";
import { Texts, useTexts } from "../contexts/Texts";

import Konva from "konva";
import { SelectionMode } from "../common/enums";

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

/* Pure functions */
const getElement = (
  event: Konva.KonvaEventObject<MouseEvent>,
  level: number
) => {
  const [x, y] = [event.evt.clientX, event.evt.clientY];
  return document.elementsFromPoint(x, y)[level];
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

const getSpan = (event: Konva.KonvaEventObject<MouseEvent>) => {
  return getElement(event, 3);
};

const getAttributes = (
  event: Konva.KonvaEventObject<MouseEvent>,
  condition: boolean = false
) => {
  const span = getSpan(event);
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

const resetSelectionOnTextsChange = ({
  setSelection,
  texts,
}: {
  setSelection: SetTracking;
  texts: Texts;
}) =>
  useEffect(() => {
    setSelection(baseTracking);
  }, [texts]);

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

/* Canvas Component */
const Canvas = ({
  className,
  width,
  height,
}: {
  className?: string;
  width: number;
  height: number;
}) => {
  const { tracking, setTracking } = useTracking();
  const { annotations, setAnnotations } = useAnnotation();
  const { texts } = useTexts();

  resetSelectionOnTextsChange({ setSelection: setTracking, texts });

  /* Arrowing */
  const setTrackingModeToArrowing = () => {
    setTracking((prevTracking) => {
      const condition = prevTracking.mode.current === SelectionMode.Arrowing;
      return {
        ...prevTracking,
        mode: {
          ...prevTracking.mode,
          current: SelectionMode.Arrowing,
          previous: condition
            ? prevTracking.mode.previous
            : prevTracking.mode.current,
        },
      };
    });
  };

  /* Mouse Event Handlers */
  const setTrackingAnchor = (target: SpanID) => {
    setTracking((prevTracking) => {
      return {
        ...prevTracking,
        mode: {
          current: SelectionMode.Selecting,
          previous: prevTracking.mode.current,
        },
        current: {
          ...prevTracking.current,
          anchor: target,
        },
      };
    });
  };

  const setSelectionAnchor = (target: SpanID) => {
    setAnnotations((prevAnnotations) => {
      return {
        ...prevAnnotations,
        selection: {
          ...prevAnnotations.selection,
          anchor: target,
          target,
        },
      };
    });
  };

  const setTrackingPrevious = () => {
    setTracking((prevTracking) => {
      return {
        ...prevTracking,
        mode: {
          current: SelectionMode.None,
          previous: prevTracking.mode.current,
        },
      };
    });
  };

  const setTrackingTarget = (target: SpanID) => {
    setTracking((prevTracking) => {
      return {
        ...prevTracking,
        current: { ...prevTracking.current, target },
      };
    });
  };

  const setSelectionWithSort = (target: SpanID) => {
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

  const setArrowAnchor = (target: SpanID) => {
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
        highlights: {
          ...prevAnnotations.highlights,
          inCreation: {
            anchor: { start: target, end: target },
            target: { start: target, end: target },
            colour: prevAnnotations.activeColour,
          },
        },
      };
    });
  };

  const setArrowTarget = (target: SpanID) => {
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
        highlights: {
          ...prevAnnotations.highlights,
          inCreation: {
            ...prevAnnotations.highlights.inCreation,
            target: { start: target, end: target },
          },
        },
      };
    });
  };

  const finaliseArrowCreation = () => {
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
        highlights: {
          ...prevAnnotations.highlights,
          inCreation: {
            anchor: { start: NaNInterval, end: NaNInterval },
            target: { start: NaNInterval, end: NaNInterval },
            colour: prevAnnotations.activeColour,
          },
          finished: [
            ...prevAnnotations.highlights.finished,
            prevAnnotations.highlights.inCreation,
          ],
        },
      };
    });
  };

  const handleMouseDown = (event: Konva.KonvaEventObject<MouseEvent>) => {
    /* Scenarios:
        1. Mouse1 down
            - Start selection, checking that you are on a word
        2. Mouse1 down + Ctrl key down
            - Set arrow anchor
    */
    const { target, isEarlyReturn } = getAttributes(event);
    if (isEarlyReturn) return;
    setTrackingAnchor(target as SpanID);
    if (event.evt.ctrlKey) {
      setTrackingModeToArrowing();
      setArrowAnchor(target as SpanID);
    } else {
      setSelectionAnchor(target as SpanID);
      setSelectionWithSort(target as SpanID);
    }
  };

  const handleMouseMove = (event: Konva.KonvaEventObject<MouseEvent>) => {
    /* Scenarios:
        1. Mouse moving
            - Do nothing
        2. Mouse moving + Mouse1 down
            - Selection
        3. Mouse moving + Mouse1 down + Ctrl key down
            - Arrowing
    */
    const { target, isEarlyReturn } = getAttributes(
      event,
      !(tracking.mode.current !== SelectionMode.None)
    );
    if (isEarlyReturn) return;
    setTrackingTarget(target as SpanID);
    if (event.evt.ctrlKey) {
      setTrackingModeToArrowing();
      setArrowTarget(target as SpanID);
    } else {
      setSelectionWithSort(target as SpanID);
    }
  };

  const handleMouseUp = (event: Konva.KonvaEventObject<MouseEvent>) => {
    const { target, isEarlyReturn } = getAttributes(
      event,
      !(tracking.mode.current !== SelectionMode.None)
    );
    setTrackingPrevious();
    if (isEarlyReturn) return;
    setTrackingTarget(target as SpanID);
    setSelectionWithSort(target as SpanID);
    finaliseArrowCreation();
  };

  const selectionBoxes = getSelectionOffsetBoundingRect(
    annotations.selection
  ).map((item, index) => (
    <Rect
      x={item.x}
      y={item.y}
      width={item.width}
      height={item.height}
      fill="blue"
      key={index}
      opacity={0.2}
    />
  ));

  const highlights = [
    ...annotations.highlights.finished,
    annotations.highlights.inCreation,
  ];
  const highlightBoxes = highlights.map((highlightIndex) =>
    [
      ...getSelectionOffsetBoundingRect(highlightIndex.anchor),
      ...getSelectionOffsetBoundingRect(highlightIndex.target),
    ].map((item, index) => (
      <Rect
        x={item.x}
        y={item.y}
        width={item.width}
        height={item.height}
        fill={highlightIndex.colour.arrow}
        key={index}
        opacity={0.2}
      />
    ))
  );

  const getConnectorPointFromInterval = (interval: Interval) => {
    // Returns the (x,y) connector point coordinate from an Interval
    // Current implementation: Get the middle of the bounding boxes
    const midpoints = getSelectionOffsetBoundingRect(interval).map((item) => {
      return {
        x: item.x + 0.5 * item.width,
        y: item.y + 0.5 * item.height,
      };
    });
    if (midpoints.length !== 0) {
      return midpoints.reduceRight((previous, current) => {
        return { x: previous.x - current.x, y: previous.y - current.y };
      });
    }
  };

  const getConnectorPointsFromArrowIndices = (arrowIndex: Indices) => {
    // Takes in ArrowIndices and returns the two connector points
    return {
      anchor: getConnectorPointFromInterval(arrowIndex.anchor),
      target: getConnectorPointFromInterval(arrowIndex.target),
      colour: arrowIndex.colour,
    };
  };

  const arrows = [
    ...annotations.arrows.finished,
    annotations.arrows.inCreation,
  ];
  const arrowLines = arrows.map((arrowIndex, index) => {
    const { anchor, target, colour } =
      getConnectorPointsFromArrowIndices(arrowIndex);
    if (anchor && target) {
      return (
        <Arrow
          x={0}
          y={0}
          points={[anchor.x, anchor.y, target.x, target.y]}
          pointerLength={7}
          pointerWidth={7}
          fill={colour.arrow}
          stroke={colour.arrow}
          opacity={0.6}
          strokeWidth={1.5}
          key={index}
          dashEnabled={true}
          dash={[5, 5]}
        />
      );
    }
  });

  return (
    <Stage
      className={className}
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <Layer>
        {selectionBoxes}
        {highlightBoxes}
        {arrowLines}
      </Layer>
    </Stage>
  );
};

export default Canvas;
