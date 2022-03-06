import React, { useState } from 'react';
import { SelectionMode } from '../common/constants';
import { SetTracking, Tracking } from '../common/types';


/* The Tracking context provides information on current and previous modes of
   selection (e.g. Arrowing, Selecting, None) and also where the mouse currently
   is on the canvas.

   The state is used in the state machine handlers in Canvas.tsx by the mouse
   and keyboard actions.
*/

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

export { baseTracking, TrackingProvider, useTracking };
