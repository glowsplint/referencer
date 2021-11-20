import {
  Annotations,
  HighlightIndices,
  Selection,
  useAnnotation,
} from "../contexts/Annotations";
import {
  CurrentTracking,
  SetTracking,
  SpanID,
  Tracking,
  baseTracking,
  useTracking,
} from "../contexts/Tracking";
import { Layer, Rect, Stage } from "react-konva";
import React, { useEffect } from "react";
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

const getCurrentSpanAttributes = (span: Element, spanParent: Element) => {
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

const getSpanAndParent = (event: Konva.KonvaEventObject<MouseEvent>) => {
  return { span: getElement(event, 3), spanParent: getElement(event, 4) };
};

const getAttributes = (
  event: Konva.KonvaEventObject<MouseEvent>,
  condition: boolean = false
) => {
  const { span, spanParent } = getSpanAndParent(event);
  // Check that we are ending on a word (span), return early otherwise
  const isEarlyReturn = condition || span.tagName.toLowerCase() === "div";
  if (isEarlyReturn) {
    return {
      target: undefined,
      isEarlyReturn: true,
    };
  }
  const { target } = getCurrentSpanAttributes(span, spanParent);
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

const getSelectionBoundingRect = (
  currentSelection: Selection | HighlightIndices
): DOMRect[] => {
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

const setTrackingTarget = (prevTracking: Tracking, target: SpanID) => {
  return {
    ...prevTracking,
    current: { ...prevTracking.current, target },
  };
};

const setSelectionWithSort = (prevAnnotations: Annotations, target: SpanID) => {
  const { start, end } = sortSpanIDs([
    prevAnnotations.selection.anchor as SpanID,
    target as SpanID,
  ]);
  return {
    ...prevAnnotations,
    selection: { ...prevAnnotations.selection, start, end },
  };
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

  /* Drawing */
  useEffect(() => {
    const setSelectionModeToDrawing = (event: KeyboardEvent) => {
      if (event.key === "Control") {
        event.preventDefault();
        setTracking((prevTracking) => {
          const condition = prevTracking.mode.current === SelectionMode.Drawing;
          return {
            ...prevTracking,
            mode: {
              current: SelectionMode.Drawing,
              previous: condition
                ? prevTracking.mode.previous
                : prevTracking.mode.current,
            },
          };
        });
      }
    };

    const setSelectionModeToPrevious = (event: KeyboardEvent) => {
      if (event.key === "Control") {
        event.preventDefault();
        setTracking((prevTracking) => {
          return {
            ...prevTracking,
            mode: {
              current: prevTracking.mode.previous,
              previous: prevTracking.mode.current,
            },
          };
        });
      }
    };

    window.addEventListener("keydown", setSelectionModeToDrawing);
    window.addEventListener("keyup", setSelectionModeToPrevious);

    return () => {
      window.removeEventListener("keydown", setSelectionModeToDrawing);
      window.removeEventListener("keyup", setSelectionModeToPrevious);
    };
  }, []);

  /* Mouse Event Handlers */
  const setTrackingCurrent = (target: SpanID) => {
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

  const setAnnotationSelection = (target: SpanID) => {
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

  const handleMouseDown = (event: Konva.KonvaEventObject<MouseEvent>) => {
    const { target, isEarlyReturn } = getAttributes(event);
    if (isEarlyReturn) return;
    setTrackingCurrent(target as SpanID);
    setAnnotationSelection(target as SpanID);
  };

  const handleMouseMove = (event: Konva.KonvaEventObject<MouseEvent>) => {
    const { target, isEarlyReturn } = getAttributes(
      event,
      !(tracking.mode.current == SelectionMode.Selecting)
    );
    if (isEarlyReturn) return;
    setTracking((prevTracking) =>
      setTrackingTarget(prevTracking, target as SpanID)
    );
    setAnnotations((prevAnnotations) =>
      setSelectionWithSort(prevAnnotations, target as SpanID)
    );
  };

  const handleMouseUp = (event: Konva.KonvaEventObject<MouseEvent>) => {
    const { target, isEarlyReturn } = getAttributes(
      event,
      !(tracking.mode.current == SelectionMode.Selecting)
    );
    setTracking((prevTracking) => {
      return {
        ...prevTracking,
        mode: {
          current: SelectionMode.None,
          previous: prevTracking.mode.current,
        },
      };
    });
    if (isEarlyReturn) return;
    setTracking((prevTracking) =>
      setTrackingTarget(prevTracking, target as SpanID)
    );
    setAnnotations((prevAnnotations) =>
      setSelectionWithSort(prevAnnotations, target as SpanID)
    );
  };

  /* Create bounding rectangles to be rendered using data from Highlight context */
  const getSelectionOffsetBoundingRect = (
    current: Selection | HighlightIndices
  ) => {
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

  const highlightBoxes = annotations.highlights.map((highlightIndex) =>
    getSelectionOffsetBoundingRect(highlightIndex).map((item, index) => (
      <Rect
        x={item.x}
        y={item.y}
        width={item.width}
        height={item.height}
        fill={highlightIndex.colour}
        key={index}
        opacity={0.2}
      />
    ))
  );

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
        {/* {arrows} */}
      </Layer>
    </Stage>
  );
};

export default Canvas;
