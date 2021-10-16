import React, { useState } from "react";
import { ColourType } from "../enums/enums";

const HighlightContext = React.createContext<Partial<HighlightState>>({});

export type Interval = [number, number];

export type HighlightIndices = {
  // textAreaID
  [key: number]: {
    // dataIndex
    [key: number]: {
      // Key: Colour, Value: [Start, End] positions
      [key in ColourType]: Interval[];
    };
  };
};

export type HighlightIndicesChange = { [key: number]: Interval[] };

type HighlightState = {
  highlightIndices: HighlightIndices;
  setHighlightIndices: (newHighlightIndices: HighlightIndices) => void;
  resetHighlightIndices: () => void;
};

export const HighlightProvider = ({ children }) => {
  const [highlights, setHighlights] = useState<HighlightState>({
    highlightIndices: {},
    setHighlightIndices: (newHighlightIndices: HighlightIndices) => {
      setHighlights({
        highlightIndices: newHighlightIndices,
        setHighlightIndices: highlights.setHighlightIndices,
        resetHighlightIndices: highlights.resetHighlightIndices,
      });
    },
    resetHighlightIndices: () => {
      setHighlights({
        highlightIndices: {},
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
