import React, { useState } from "react";
import { ColourType } from "../enums/enums";

const HighlightContext = React.createContext<Partial<HighlightState>>({});

export type Interval = [number, number];

export type HighlightIndices = Map<
  number,
  Map<number, Map<ColourType, Interval[]>>
>;

export type HighlightIndicesChange = Map<number, Interval>;

type HighlightState = {
  highlightIndices: HighlightIndices;
  setHighlightIndices: (newHighlightIndices: HighlightIndices) => void;
  resetHighlightIndices: () => void;
};

export const HighlightProvider = ({ children }) => {
  const [highlights, setHighlights] = useState<HighlightState>({
    highlightIndices: new Map<
      number,
      Map<number, Map<ColourType, Interval[]>>
    >(),
    setHighlightIndices: (newHighlightIndices: HighlightIndices) => {
      setHighlights({
        highlightIndices: newHighlightIndices,
        setHighlightIndices: highlights.setHighlightIndices,
        resetHighlightIndices: highlights.resetHighlightIndices,
      });
    },
    resetHighlightIndices: () => {
      setHighlights({
        highlightIndices: new Map(),
        setHighlightIndices: highlights.setHighlightIndices,
        resetHighlightIndices: highlights.resetHighlightIndices,
      });
    },
  });

  return (
    <HighlightContext.Provider value={highlights}>
      {children}
    </HighlightContext.Provider>
  );
};

export const useHighlight = () => {
  return React.useContext(HighlightContext);
};
