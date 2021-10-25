import React, { SetStateAction, useState } from "react";
import { SpanID } from "./Selection";

export type HighlightIndices = {
  textAreaID: number;
  colour: string;
  start: SpanID;
  end: SpanID;
};

export type Highlight = {
  highlights: HighlightIndices[];
};

const baseHighlight: Highlight = {
  highlights: [],
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
