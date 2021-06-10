import React, { useState } from "react";

type Texts = {
  headers: string[];
  bodies: string[];
  isDisplayed: boolean[];
};

type DisplayedTexts = {
  headers: string[];
  bodies: string[];
};

type TextState = {
  texts: Texts;
  displayedTexts: DisplayedTexts;
  setTexts: (newTexts: Texts) => void;
};

const TextsContext = React.createContext<Partial<TextState>>({});

export const TextsProvider = ({ children }) => {
  const display = (newTexts: Texts): DisplayedTexts => {
    const indices: number[] = newTexts.isDisplayed.flatMap((bool, index) =>
      bool ? index : []
    );

    let headers = [];
    let bodies = [];
    for (let item of indices) {
      headers.push(newTexts.headers[item]);
      bodies.push(newTexts.bodies[item]);
    }
    return { headers: headers, bodies: bodies };
  };

  const [textInfo, setTextInfo] = useState({
    texts: { headers: [], bodies: [], isDisplayed: [] },
    displayedTexts: { headers: [], bodies: [] },
    setTexts: (newTexts: Texts) => {
      setTextInfo({
        texts: newTexts,
        displayedTexts: display(newTexts),
        setTexts: textInfo.setTexts,
      });
    },
  });

  return (
    <TextsContext.Provider value={textInfo}>{children}</TextsContext.Provider>
  );
};

export const useTexts = () => {
  return React.useContext(TextsContext);
};
