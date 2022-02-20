import React, { SetStateAction, useState } from "react";
import { amber } from "@mui/material/colors";
import { Annotations, SetAnnotations, SpanID } from "../components/types";

const NaNInterval: SpanID = [NaN, NaN, NaN, NaN];
const baseColour = amber["500"];
const baseAnnotations: Annotations = {
  isPainterMode: false,
  activeColour: baseColour,
  highlights: new Map(),
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
    finished: new Map(),
  },
};

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

export { AnnotationsProvider, useAnnotations, baseAnnotations, NaNInterval };
