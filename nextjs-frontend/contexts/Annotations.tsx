import React, { SetStateAction, useState } from "react";

import { SpanID } from "./Tracking";

type Interval = {
  start: SpanID;
  end: SpanID;
};

type HighlightIndices = { colour: string } & Interval;

type ArrowIndices = Interval;

interface Selection extends Interval {
  anchor?: SpanID;
}

interface Arrows {
  inCreation: ArrowIndices;
  finished: ArrowIndices[];
}

interface Annotations {
  highlights: HighlightIndices[];
  selection: Selection;
  arrows: Arrows;
}

const baseAnnotations: Annotations = {
  highlights: [],
  selection: {
    start: [NaN, NaN, NaN, NaN],
    end: [NaN, NaN, NaN, NaN],
  },
  arrows: {
    inCreation: {
      start: [NaN, NaN, NaN, NaN],
      end: [NaN, NaN, NaN, NaN],
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
  SetAnnotations,
  Annotations,
  HighlightIndices,
  Selection,
  Interval,
};
export { AnnotationsProvider, useAnnotation, baseAnnotations };
