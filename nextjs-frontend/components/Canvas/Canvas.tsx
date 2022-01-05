import { Arrow, Layer, Rect, Stage } from "react-konva";
import {
  ArrowIndices,
  Interval,
  useAnnotations,
} from "../../contexts/Annotations";
import { SpanID, useTracking } from "../../contexts/Tracking";
import { StateMachineKeyboard, StateMachineMouse } from "../types/types";
import {
  finaliseArrowCreation,
  getAttributes,
  getSelectionOffsetBoundingRect,
  resetSelectionOnTextsChange,
  setArrowAnchor,
  setArrowTarget,
  setSelectionAnchor,
  setSelectionWithSort,
  setTrackingMode,
} from "./actions";

import Konva from "konva";
import React from "react";
import { SelectionMode } from "../../common/enums";
import { useTexts } from "../../contexts/Texts";

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

  const mouseDownArrowing = (event: MouseEvent, target: SpanID) => {
    return {
      condition: isArrowing(event),
      handler: () => setArrowAnchor(target as SpanID, setAnnotations),
    };
  };

  const mouseDownSelecting = (event: MouseEvent, target: SpanID) => {
    return {
      condition: true,
      handler: () => {
        setTrackingMode(SelectionMode.Selecting, setTracking);
        setSelectionAnchor(target as SpanID, setAnnotations);
        setSelectionWithSort(target as SpanID, setAnnotations);
      },
    };
  };

  const mouseMoveSelecting = (event: MouseEvent, target: SpanID) => {
    return {
      condition: event.buttons == 1,
      handler: () => {
        setSelectionWithSort(target as SpanID, setAnnotations);
      },
    };
  };

  const mouseMoveArrowing = (event: MouseEvent, target: SpanID) => {
    return {
      condition: event.buttons == 1 && isArrowing(event),
      handler: () => {
        setArrowTarget(target as SpanID, setAnnotations);
      },
    };
  };

  const mouseUpSelecting = (event: MouseEvent, target: SpanID) => {
    return {
      condition: true,
      handler: () => {
        setSelectionWithSort(target as SpanID, setAnnotations);
      },
    };
  };

  const mouseUpArrowing = (event: MouseEvent, target: SpanID) => {
    return {
      condition: true,
      handler: () => {
        finaliseArrowCreation(setAnnotations);
      },
    };
  };

  const keyUpArrowing = (event: React.KeyboardEvent, target: SpanID) => {
    return {
      condition: isArrowing(event),
      handler: () => {
        setTrackingMode(SelectionMode.Selecting, setTracking);
        setSelectionAnchor(target as SpanID, setAnnotations);
      },
    };
  };

  const keyUpSelecting = (event: React.KeyboardEvent, target: SpanID) => {
    return {
      condition: isArrowing(event),
      handler: () => {
        setTrackingMode(SelectionMode.None, setTracking);
      },
    };
  };

  const keyDownArrowing = (event: React.KeyboardEvent, target: SpanID) => {
    return {
      condition: isArrowing(event),
      handler: () => {
        if (tracking.mode.current === SelectionMode.Selecting) {
          setArrowAnchor(target as SpanID, setAnnotations);
        }
        setTrackingMode(SelectionMode.Arrowing, setTracking);
      },
    };
  };

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
    setTrackingMode(SelectionMode.None, setTracking);
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
