import React, { useState } from "react";
import { Highlight } from "../enums/enums";

const HighlightingContext = React.createContext({});

type HighlightSelection = {
  [key in Highlight]: Selection[];
};

export const HighlightProvider = ({ children }) => {
  const [highlights, setHighlights] = useState({
    highlightSelections: {},
    setHighlightSelections: (newHighlightSelection: HighlightSelection) => {
      setHighlights({
        highlightSelections: newHighlightSelection,
        setHighlightSelections: highlights.setHighlightSelections,
      });
    },
  });

  return (
    <HighlightingContext.Provider value={highlights}>
      {children}
    </HighlightingContext.Provider>
  );
};

export const useHighlight = () => {
  return React.useContext(HighlightingContext);
};
