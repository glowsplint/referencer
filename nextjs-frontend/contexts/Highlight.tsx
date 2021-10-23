import React, { SetStateAction, useState } from "react";
import { ColourType } from "../common/enums";

export type Interval = [number, number];

export type HighlightIndices = {
  // textAreaID
  [key: number]: {
    // Key: Colour
    [key in ColourType]: {
      // dataIndex
      [key: number]: Interval[];
    };
  };
};

export type Highlight = {
  highlight: HighlightIndices;
};

const baseHighlight = {
  highlight: {},
};

export type SetHighlight = React.Dispatch<SetStateAction<Highlight>>;

const HighlightContext = React.createContext<{
  highlight: Highlight;
  setHighlight: SetHighlight;
}>({
  highlight: baseHighlight,
  setHighlight: () => {},
});

export const HighlightProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [highlight, setHighlight] = useState(baseHighlight);

  return (
    <HighlightContext.Provider value={{ highlight, setHighlight }}>
      {children}
    </HighlightContext.Provider>
  );
};

export const useHighlight = () => {
  return React.useContext(HighlightContext);
};
