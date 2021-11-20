import React, { SetStateAction, useState } from "react";

import { SpanID } from "./Selection";

type Interval = {
  start: SpanID;
  end: SpanID;
};

type HighlightIndices = { colour: string } & Interval;

type ArrowIndices = Interval;

interface Annotations {
  highlights: HighlightIndices[];
  arrows: ArrowIndices[];
}

const baseAnnotations: Annotations = {
  highlights: [],
  arrows: [],
};

type SetAnnotation = React.Dispatch<SetStateAction<Annotations>>;

const AnnotationContext = React.createContext<{
  annotations: Annotations;
  setAnnotations: SetAnnotation;
}>({
  annotations: baseAnnotations,
  setAnnotations: () => {},
});

const AnnotationProvider = ({ children }: { children: React.ReactNode }) => {
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

export type { SetAnnotation, Annotations, HighlightIndices };
export { AnnotationProvider, useAnnotation };
