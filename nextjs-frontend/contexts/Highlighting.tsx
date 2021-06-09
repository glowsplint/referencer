import React, { useState } from "react";
import { Highlight } from "../enums/enums";

const HighlightingContext = React.createContext({
  highlightSelections: {},
  addHighlight: (colour: string, selection: Selection[]) => {},
});

export const HighlightProvider = ({ children }) => {
  const addHighlight = (
    colour: Highlight,
    newHighlightSelection: Selection[]
  ) => {
    setHighlights({ ...highlights });
  };

  const removeHighlight = () => {};

  const [highlights, setHighlights] = useState({
    highlightSelections: {},
    addHighlight: addHighlight,
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
