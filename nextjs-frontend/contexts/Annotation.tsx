import React, { SetStateAction, useState } from "react";

import { SpanID } from "./Selection";

interface HighlightIndices {
  textAreaID: number;
  colour: string;
  start: SpanID;
  end: SpanID;
}

interface Annotations {
  highlights: HighlightIndices[];
}

const baseAnnotations: Annotations = {
  highlights: [],
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
