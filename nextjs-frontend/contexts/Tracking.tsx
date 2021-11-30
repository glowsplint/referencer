import React, { SetStateAction, useState } from "react";

import { SelectionMode } from "../common/enums";
import { number } from "prop-types";

// SpanID is [textAreaID, data-text-index, data-phrase-index, data-pure-text-index]
type SpanID = [number, number, number, number];

interface ITracking {
  current: SelectionMode;
  previous: SelectionMode;
}

interface Tracking {
  mode: ITracking;
  mouse: {
    x: number;
    y: number;
  };
}

type SetTracking = React.Dispatch<SetStateAction<Tracking>>;

const baseTracking: Tracking = {
  mode: {
    current: SelectionMode.None,
    previous: SelectionMode.None,
  },
  mouse: {
    x: NaN,
    y: NaN,
  },
};

const TrackingContext = React.createContext<{
  tracking: Tracking;
  setTracking: SetTracking;
}>({
  tracking: baseTracking,
  setTracking: () => {},
});

const TrackingProvider = ({ children }: { children: React.ReactNode }) => {
  const [tracking, setTracking] = useState(baseTracking);

  return (
    <TrackingContext.Provider value={{ tracking, setTracking }}>
      {children}
    </TrackingContext.Provider>
  );
};

const useTracking = () => {
  return React.useContext(TrackingContext);
};

export type { SpanID, Tracking, SetTracking };
export { baseTracking, TrackingProvider, useTracking };
