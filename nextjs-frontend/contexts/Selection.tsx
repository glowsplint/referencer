import React, { SetStateAction, useState } from "react";

// SpanID is [textAreaID, data-text-index, data-phrase-index, data-pure-text-index]
export type SpanID = [number, number, number, number];

export type CurrentSelection = {
  textAreaID?: number;
  anchor?: SpanID;
  start?: SpanID;
  end?: SpanID;
};

export type Selection = {
  selecting: boolean;
  current: CurrentSelection;
};

export type SetSelection = React.Dispatch<SetStateAction<Selection>>;

const baseSelection = {
  selecting: false,
  current: {},
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
