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

export type ColourArr = [number, number, number, number];

export const blendColour = (
  [rb, gb, bb, ab]: ColourArr, // this is the base colour
  [ra, ga, ba, aa]: ColourArr // this is the added colour
): ColourArr => {
  let inv = ab * (1 - aa);
  let a = aa + inv;
  let r = (ra * aa + rb * inv) / a;
  let g = (ga * aa + gb * inv) / a;
  let b = (ba * aa + bb * inv) / a;

  return [r, g, b, a];
};

export const strToColour = (s: string, alpha: number): ColourArr => {
  if (s.length == 7) {
    let r = parseInt(s.substr(1, 2), 16);
    let g = parseInt(s.substr(3, 2), 16);
    let b = parseInt(s.substr(5, 2), 16);
    if (alpha > 1 || alpha < 0) alpha = 1;
    return [r / 255, g / 255, b / 255, alpha];
  }
  return [0, 0, 0, 0];
};

export const colourToStr = ([r, g, b, a]: ColourArr): string => {
  if (r <= 0) {
    r = 0;
  } else if (r >= 1) {
    r = 255;
  } else {
    r = Math.round(r * 255);
  }
  if (g <= 0) {
    g = 0;
  } else if (g >= 1) {
    g = 255;
  } else {
    g = Math.round(g * 255);
  }
  if (b <= 0) {
    b = 0;
  } else if (b >= 1) {
    b = 255;
  } else {
    b = Math.round(b * 255);
  }
  let result = "#".concat(r.toString(16), g.toString(16), b.toString(16));
  return result;
};
