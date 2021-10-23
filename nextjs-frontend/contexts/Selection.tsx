import React, { SetStateAction, useState } from "react";
import { Interval } from "./Highlight";

type Selection = {
  current: Interval;
};

export type SetSelection = React.Dispatch<SetStateAction<Selection>>;

const baseSelection = {
  current: [NaN, NaN] as Interval,
};

const SelectionContext = React.createContext<{
  selection: Selection;
  setSelection: SetSelection;
}>({
  selection: baseSelection,
  setSelection: () => {},
});

export const SelectionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [selection, setSelection] = useState(baseSelection);

  return (
    <SelectionContext.Provider value={{ selection, setSelection }}>
      {children}
    </SelectionContext.Provider>
  );
};

export const useSelection = () => {
  return React.useContext(SelectionContext);
};
