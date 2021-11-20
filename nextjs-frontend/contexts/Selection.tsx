import React, { SetStateAction, useState } from "react";

import { SelectionMode } from "../common/enums";

// SpanID is [textAreaID, data-text-index, data-phrase-index, data-pure-text-index]
type SpanID = [number, number, number, number];

interface CurrentSelection {
  textAreaID?: number;
  anchor?: SpanID;
  start?: SpanID;
  end?: SpanID;
}

interface ISelection {
  current: SelectionMode;
  previous: SelectionMode;
}

interface Selection {
  mode: ISelection;
  current: CurrentSelection;
}

type SetSelection = React.Dispatch<SetStateAction<Selection>>;

const baseSelection = {
  mode: { current: SelectionMode.None, previous: SelectionMode.None },
  current: {},
};

const SelectionContext = React.createContext<{
  selection: Selection;
  setSelection: SetSelection;
}>({
  selection: baseSelection,
  setSelection: () => {},
});

const SelectionProvider = ({ children }: { children: React.ReactNode }) => {
  const [selection, setSelection] = useState(baseSelection);

  return (
    <SelectionContext.Provider value={{ selection, setSelection }}>
      {children}
    </SelectionContext.Provider>
  );
};

const useSelection = () => {
  return React.useContext(SelectionContext);
};

export type { SpanID, CurrentSelection, Selection, SetSelection };
export { baseSelection, SelectionProvider, useSelection };
