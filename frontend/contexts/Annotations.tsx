import { COLOURS, IColour } from "../common/enums";
import React, { SetStateAction, useState } from "react";

import { SpanID } from "./Tracking";

interface Interval {
  start: SpanID;
  end: SpanID;
}

// Arrows consist of an anchor, target and colour
interface ArrowIndices {
  anchor: Interval;
  target: Interval;
  colour: IColour;
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
  colour: IColour;
  text: string;
}

interface Annotations {
  highlights: Highlights[];
  selection: Selection;
  arrows: Arrows;
  activeColour: IColour;
}

const NaNInterval: SpanID = [NaN, NaN, NaN, NaN];

const baseColour = COLOURS.Blue;
const baseAnnotations: Annotations = {
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
