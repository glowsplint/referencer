import React, { SetStateAction, useState } from "react";

import { SpanID } from "./Tracking";

interface Interval {
  start: SpanID;
  end: SpanID;
}

interface ArrowIndices {
  anchor: Interval;
  target: Interval;
}

interface Arrows {
  inCreation: ArrowIndices;
  finished: ArrowIndices[];
}

interface HighlightIndices extends Interval {
  colour: string;
}

interface Selection extends Interval {
  anchor?: SpanID;
}

interface Annotations {
  highlights: HighlightIndices[];
  selection: Selection;
  arrows: Arrows;
}

const NaNInterval: SpanID = [NaN, NaN, NaN, NaN];

const baseAnnotations: Annotations = {
  highlights: [],
  selection: {
    start: NaNInterval,
    end: NaNInterval,
  },
  arrows: {
    inCreation: {
      anchor: { start: NaNInterval, end: NaNInterval },
      target: { start: NaNInterval, end: NaNInterval },
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

const useAnnotation = () => {
  return React.useContext(AnnotationContext);
};

export type {
  Annotations,
  ArrowIndices,
  HighlightIndices,
  Interval,
  Selection,
  SetAnnotations,
};
export { AnnotationsProvider, useAnnotation, baseAnnotations, NaNInterval };
