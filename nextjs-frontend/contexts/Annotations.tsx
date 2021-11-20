import React, { SetStateAction, useState } from "react";

import { SpanID } from "./Tracking";

type Interval = {
  start: SpanID;
  end: SpanID;
};

type HighlightIndices = { colour: string } & Interval;

type ArrowIndices = Interval;

interface Selection {
  anchor?: SpanID;
  start?: SpanID;
  end?: SpanID;
}

interface Annotations {
  highlights: HighlightIndices[];
  selection: Selection;
  arrows: ArrowIndices[];
}

const baseAnnotations: Annotations = {
  highlights: [],
  selection: {},
  arrows: [],
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
  SetAnnotations as SetAnnotation,
  Annotations,
  HighlightIndices,
  Selection,
};
export { AnnotationsProvider as AnnotationProvider, useAnnotation };
