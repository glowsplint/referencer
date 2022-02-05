import React, { SetStateAction, useState } from "react";

import { SpanID } from "./Tracking";
import { amber } from "@mui/material/colors";

interface Interval {
  start: SpanID;
  end: SpanID;
}

// Arrows consist of an anchor, target and colour
interface ArrowIndices {
  anchor: Interval;
  target: Interval;
  colour: string;
}

// While the arrow is in creation, its target can change but its anchor is fixed.
type Storage<T> = {
  inCreation: T;
  finished: T[];
};

type Arrows = Storage<ArrowIndices>;

interface Selection extends Interval {
  anchor?: SpanID;
}

interface Highlights extends Interval {
  colour: string;
  text: string;
}

interface Annotations {
  isPainterMode: boolean;
  activeColour: string;
  arrows: Arrows;
  highlights: Highlights[];
  selection: Selection;
}

const NaNInterval: SpanID = [NaN, NaN, NaN, NaN];

const baseColour = amber["500"];
const baseAnnotations: Annotations = {
  isPainterMode: false,
  activeColour: baseColour,
  highlights: [],
  selection: {
    start: NaNInterval,
    end: NaNInterval,
  },
  arrows: {
    inCreation: {
      anchor: { start: NaNInterval, end: NaNInterval },
      target: { start: NaNInterval, end: NaNInterval },
      colour: baseColour,
    },
    finished: [],
  },
};

type SetAnnotations = React.Dispatch<SetStateAction<Annotations>>;

const AnnotationContext = React.createContext<{
  annotations: Annotations;
  setAnnotations: SetAnnotations;
}>({
  annotations: baseAnnotations,
  setAnnotations: () => {},
});

const AnnotationsProvider = ({ children }: { children: React.ReactNode }) => {
  const [annotations, setAnnotations] = useState(baseAnnotations);

  return (
    <AnnotationContext.Provider value={{ annotations, setAnnotations }}>
      {children}
    </AnnotationContext.Provider>
  );
};

const useAnnotations = () => {
  return React.useContext(AnnotationContext);
};

export type {
  Annotations,
  ArrowIndices,
  Interval,
  Selection,
  SetAnnotations,
  Arrows,
  Highlights,
};
export { AnnotationsProvider, useAnnotations, baseAnnotations, NaNInterval };
