import Konva from "konva";
import React from "react";
import { Stage, Layer, Rect } from "react-konva";
import { Interval, useHighlight } from "../contexts/Highlight";
import { useSelection } from "../contexts/Selection";

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

const Canvas = ({
  className,
  width,
  height,
}: {
  className?: string;
  width: number;
  height: number;
}) => {
  const { selection, setSelection } = useSelection();
  const { highlight, setHighlight } = useHighlight();

  const handleClick = (event: Konva.KonvaEventObject<MouseEvent>) => {
    const [x, y] = [event.evt.clientX, event.evt.clientY];
    const getSpan = () => document.elementsFromPoint(x, y)[3];
    const intervalString = (getSpan() as HTMLElement).dataset.index as string;
    const interval = intervalString
      .split(",")
      .map((x) => Number(x)) as Interval;

    // Update highlight context with the span's dataIndex
    setSelection((prevSelection) => {
      return { ...prevSelection, current: interval };
    });
  };

  const getParentBoundingRect = () => {
    return (
      document.getElementById("canvasContainer") as HTMLElement
    ).getBoundingClientRect();
  };

  const getSelectionBoundingRect = () => {
    /* This function should return an array of bounding rectangles in the future
       when the selection spans multiple lines */
    const currentSelection = selection.current.toString();
    const selectedNode = document.querySelectorAll(
      `[data-index='${currentSelection}']`
    );
    return [selectedNode[0]?.getBoundingClientRect()];
  };

  const getSelectionOffsetBoundingRect = () => {
    // Compensate the bounding rect with position of canvasContainer with viewport
    const parent = getParentBoundingRect();
    return getSelectionBoundingRect()
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
        return Object.entries(rect).some(([key, value]) => value == null)
          ? null
          : rect;
      })
      .filter((item) => item) as BoundingBox[];
  };

  return (
    <Stage
      className={className}
      width={width}
      height={height}
      onClick={handleClick}
    >
      <Layer>
        {/* Draw all highlights from context */}
        {getSelectionOffsetBoundingRect().map((item, index) => {
          return (
            <Rect
              x={item.x}
              y={item.y}
              width={item.width}
              height={item.height}
              fill="blue"
              key={index}
              opacity={0.2}
            />
          );
        })}
      </Layer>
    </Stage>
  );
};

export default Canvas;
