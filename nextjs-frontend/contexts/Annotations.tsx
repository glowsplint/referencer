import { COLOURS, ColourValueType, IColour } from "../common/enums";
import React, { SetStateAction, useState } from "react";

import { SpanID } from "./Tracking";

interface Interval {
  start: SpanID;
  end: SpanID;
}

type Storage<T> = {
  inCreation: T;
  finished: T[];
};

interface Indices {
  anchor: Interval;
  target: Interval;
  colour: IColour;
}

type StorageIndices = Storage<Indices>;

interface Selection extends Interval {
  anchor?: SpanID;
}

interface Annotations {
  highlights: StorageIndices;
  selection: Selection;
  arrows: StorageIndices;
  activeColour: IColour;
}

const NaNInterval: SpanID = [NaN, NaN, NaN, NaN];

const baseColour = COLOURS.Blue;
const baseAnnotations: Annotations = {
  activeColour: baseColour,
  highlights: {
    inCreation: {
      anchor: { start: NaNInterval, end: NaNInterval },
      target: { start: NaNInterval, end: NaNInterval },
      colour: baseColour,
    },
    finished: [],
  },
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

const useAnnotation = () => {
  return React.useContext(AnnotationContext);
};

export type {
  Annotations,
  Indices,
  Interval,
  Selection,
  SetAnnotations,
  StorageIndices,
};
export { AnnotationsProvider, useAnnotation, baseAnnotations, NaNInterval };
