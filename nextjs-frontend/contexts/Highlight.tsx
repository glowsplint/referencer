import React, { useState } from "react";
import { ColourType } from "../enums/enums";

const HighlightContext = React.createContext<Partial<HighlightState>>({});

export type HighlightIndices = {
  [key in ColourType]?: { [key: string]: [number, number][] };
};

type HighlightState = {
  highlightIndices: HighlightIndices;
  setHighlightIndices: (newHighlightIndices: HighlightIndices) => void;
};

export const HighlightProvider = ({ children }) => {
  const [highlights, setHighlights] = useState<HighlightState>({
    highlightIndices: {},
    setHighlightIndices: (newHighlightIndices: HighlightIndices) => {
      setHighlights({
        highlightIndices: newHighlightIndices,
        setHighlightIndices: highlights.setHighlightIndices,
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
