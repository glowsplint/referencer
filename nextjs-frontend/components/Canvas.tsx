import { Arrow, Layer, Rect, Stage } from "react-konva";
import {
  ArrowIndices,
  Interval,
  NaNInterval,
  useAnnotations,
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
const getMidpointFromDOMRect = (domRect: DOMRect): [number, number] => {
  return [domRect.x + domRect.width / 2, domRect.y + domRect.height / 2];
};

const getCoordsFromSpanID = (span: SpanID): [number, number] => {
  const element = document.getElementById(span.toString()) as HTMLElement;
  return getMidpointFromDOMRect(element.getBoundingClientRect());
};

const spanLevel = 3;

const getSpan = (x: number, y: number) => {
  return document.elementsFromPoint(x, y)[spanLevel];
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
  const { annotations, setAnnotations } = useAnnotations();
  const { texts } = useTexts();

  resetSelectionOnTextsChange({ setSelection: setTracking, texts });

  /* Tracking */
  const setTrackingMode = (selectionMode: SelectionMode) => {
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
  const setSelectionAnchor = (target: SpanID) => {
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

  /* Arrowing */
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
      };
    });
  };

  /* Notes */
  const setNotes = (target: SpanID) => {
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

  /* State Machine & Handlers */
  const isArrowing = (event: React.KeyboardEvent | MouseEvent) => {
    if (event instanceof MouseEvent) {
      return tracking.mode.current === SelectionMode.Arrowing || event.ctrlKey;
    } else {
      return (
        tracking.mode.current === SelectionMode.Arrowing ||
        event.key === "Control"
      );
    }
  };

  type StateMachinePattern<T> = (
    event: T,
    target: SpanID
  ) => {
    condition: boolean;
    handler: () => void;
  };

  const mouseDownArrowing = (event: MouseEvent, target: SpanID) => {
    return {
      condition: isArrowing(event),
      handler: () => setArrowAnchor(target as SpanID),
    };
  };

  const mouseDownSelecting = (event: MouseEvent, target: SpanID) => {
    return {
      condition: true,
      handler: () => {
        setTrackingMode(SelectionMode.Selecting);
        setSelectionAnchor(target as SpanID);
        setSelectionWithSort(target as SpanID);
      },
    };
  };

  const mouseMoveSelecting = (event: MouseEvent, target: SpanID) => {
    return {
      condition: event.buttons == 1,
      handler: () => {
        setSelectionWithSort(target as SpanID);
      },
    };
  };

  const mouseMoveArrowing = (event: MouseEvent, target: SpanID) => {
    return {
      condition: event.buttons == 1 && isArrowing(event),
      handler: () => {
        setArrowTarget(target as SpanID);
      },
    };
  };

  const mouseUpSelecting = (event: MouseEvent, target: SpanID) => {
    return {
      condition: true,
      handler: () => {
        setSelectionWithSort(target as SpanID);
      },
    };
  };

  const mouseUpArrowing = (event: MouseEvent, target: SpanID) => {
    return {
      condition: true,
      handler: () => {
        finaliseArrowCreation();
      },
    };
  };

  const keyUpArrowing = (event: React.KeyboardEvent, target: SpanID) => {
    return {
      condition: isArrowing(event),
      handler: () => {
        setTrackingMode(SelectionMode.Selecting);
        setSelectionAnchor(target as SpanID);
      },
    };
  };

  const keyUpSelecting = (event: React.KeyboardEvent, target: SpanID) => {
    return {
      condition: isArrowing(event),
      handler: () => {
        setTrackingMode(SelectionMode.None);
      },
    };
  };

  const keyDownArrowing = (event: React.KeyboardEvent, target: SpanID) => {
    return {
      condition: isArrowing(event),
      handler: () => {
        if (tracking.mode.current === SelectionMode.Selecting) {
          setArrowAnchor(target as SpanID);
        }
        setTrackingMode(SelectionMode.Arrowing);
      },
    };
  };

  interface StateMachineMouse {
    onMouseDown: StateMachinePattern<MouseEvent>[];
    onMouseMove: StateMachinePattern<MouseEvent>[];
    onMouseUp: StateMachinePattern<MouseEvent>[];
  }

  interface StateMachineKeyboard {
    onKeyUp: StateMachinePattern<React.KeyboardEvent>[];
    onKeyDown: StateMachinePattern<React.KeyboardEvent>[];
  }

  const stateMachineMouse: StateMachineMouse = {
    // Order of functions in array is important as they are evaluated left-to-right
    onMouseDown: [mouseDownArrowing, mouseDownSelecting],
    onMouseMove: [mouseMoveArrowing, mouseMoveSelecting],
    onMouseUp: [mouseUpArrowing, mouseUpSelecting],
  };

  const runStateMachineMouse = (
    event: Konva.KonvaEventObject<MouseEvent>,
    stateMachineMouse: StateMachineMouse,
    key: keyof StateMachineMouse,
    target: SpanID
  ) => {
    for (const pattern of stateMachineMouse[key]) {
      const { condition, handler } = pattern(event.evt, target);
      if (condition) {
        handler();
        break;
      }
    }
  };

  const stateMachineKeyboard: StateMachineKeyboard = {
    onKeyUp: [keyUpArrowing, keyUpSelecting],
    onKeyDown: [keyDownArrowing],
  };

  const runStateMachineKeyboard = (
    event: React.KeyboardEvent,
    stateMachineKeyboard: StateMachineKeyboard,
    key: keyof StateMachineKeyboard,
    target: SpanID
  ) => {
    for (const pattern of stateMachineKeyboard[key]) {
      const { condition, handler } = pattern(event, target);
      if (condition) {
        handler();
        break;
      }
    }
  };

  /* Mouse Event Handlers */
  const storeMouseCoords = (event: MouseEvent) => {
    setTracking((prevTracking) => {
      return { ...prevTracking, mouse: { x: event.clientX, y: event.clientY } };
    });
  };

  const handleMouseDown = (event: Konva.KonvaEventObject<MouseEvent>) => {
    // If user did not click on a word (span with a valid SpanID), return
    const { target, isEarlyReturn } = getAttributes(
      event.evt.clientX,
      event.evt.clientY
    );
    if (isEarlyReturn) return;
    runStateMachineMouse(
      event,
      stateMachineMouse,
      "onMouseDown",
      target as SpanID
    );
  };

  const handleMouseMove = (event: Konva.KonvaEventObject<MouseEvent>) => {
    // If user did not click on a word (span with a valid SpanID), return
    storeMouseCoords(event.evt);
    const { target, isEarlyReturn } = getAttributes(
      event.evt.clientX,
      event.evt.clientY,
      !(tracking.mode.current !== SelectionMode.None)
    );
    if (isEarlyReturn) return;
    runStateMachineMouse(
      event,
      stateMachineMouse,
      "onMouseMove",
      target as SpanID
    );
  };

  const handleMouseUp = (event: Konva.KonvaEventObject<MouseEvent>) => {
    storeMouseCoords(event.evt);
    setTrackingMode(SelectionMode.None);
    const { target, isEarlyReturn } = getAttributes(
      event.evt.clientX,
      event.evt.clientY,
      !(tracking.mode.current !== SelectionMode.None)
    );
    if (isEarlyReturn) return;
    runStateMachineMouse(
      event,
      stateMachineMouse,
      "onMouseUp",
      target as SpanID
    );
  };

  /* Keyboard Event Handlers */
  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    const { target, isEarlyReturn } = getAttributes(
      tracking.mouse.x,
      tracking.mouse.y
    );
    if (isEarlyReturn) return;
    runStateMachineKeyboard(
      event,
      stateMachineKeyboard,
      "onKeyDown",
      target as SpanID
    );
  };

  const handleKeyUp: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    const { target, isEarlyReturn } = getAttributes(
      tracking.mouse.x,
      tracking.mouse.y
    );
    if (isEarlyReturn) return;
    runStateMachineKeyboard(
      event,
      stateMachineKeyboard,
      "onKeyUp",
      target as SpanID
    );
  };

  /* Canvas layer components */
  const selectionBoxes = getSelectionOffsetBoundingRect(
    annotations.selection
  ).map((item, index) => (
    <Rect
      x={item.x}
      y={item.y}
      width={item.width}
      height={item.height}
      fill={annotations.activeColour.highlight}
      key={index}
      opacity={0.2}
    />
  ));

  const highlights = [
    ...annotations.highlights,
    {
      ...annotations.arrows.inCreation.anchor,
      colour: annotations.arrows.inCreation.colour,
    },
    {
      ...annotations.arrows.inCreation.target,
      colour: annotations.arrows.inCreation.colour,
    },
    ...annotations.arrows.finished.map((item) => {
      return { ...item.anchor, colour: item.colour };
    }),
    ...annotations.arrows.finished.map((item) => {
      return { ...item.target, colour: item.colour };
    }),
  ];
  const highlightBoxes = highlights.map((highlightIndex) =>
    getSelectionOffsetBoundingRect(highlightIndex).map((item, index) => (
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

  const getConnectorPointsFromArrowIndices = (arrowIndex: ArrowIndices) => {
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
    <div tabIndex={1} onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}>
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
    </div>
  );
};

export default Canvas;
