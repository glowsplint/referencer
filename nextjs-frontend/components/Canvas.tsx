import Konva from "konva";
import React from "react";
import { Stage, Layer, Rect, Circle } from "react-konva";

const Canvas = ({
  className,
  width,
  height,
}: {
  className: string;
  width: number;
  height: number;
}) => {
  const handleClick = (event: Konva.KonvaEventObject<MouseEvent>) => {
    const [x, y] = [event.evt.clientX, event.evt.clientY];
    const getSpan = () => document.elementsFromPoint(x, y)[3];
    console.log(getSpan().getBoundingClientRect());
    // Store coords into context
  };

  return (
    <Stage
      className={className}
      width={width}
      height={height}
      opacity={0}
      onClick={handleClick}
    >
      <Layer>
        <Rect width={50} height={50} fill="red" />
        <Circle x={200} y={200} stroke="black" radius={50} />
      </Layer>
    </Stage>
  );
};

export default Canvas;
