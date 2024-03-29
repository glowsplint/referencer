import "@testing-library/jest-dom";

import { fireEvent, render } from "@testing-library/react";

import ButtonPane from "../ButtonPane";
import Index from "../../pages/space";
import React from "react";
import { isBeingRendered } from "./utils/utils";

// Common functions and interfaces used within button pane
const isBeingRenderedWithButtonPane = ({ testId }: { testId: string }) =>
  isBeingRendered({ testId, component: <ButtonPane /> });

type JSSObject = { [key: string]: string };

interface JointState<T> {
  initial: T;
  toggled: T;
}

type Checker<T> = ({
  subject,
  state,
  stateProperty,
}: {
  subject: HTMLElement;
  state: JointState<T>;
  stateProperty: keyof JointState<T>;
}) => void;

type ClassChecker = Checker<string>;
type StyleChecker = Checker<JSSObject>;

const checkClassOfSubject: ClassChecker = ({
  subject,
  state,
  stateProperty,
}: {
  subject: HTMLElement;
  state: JointState<string>;
  stateProperty: keyof JointState<string>;
}) => {
  expect(subject).toHaveClass(state[stateProperty]);
};

const checkStyleOfSubject: StyleChecker = ({
  subject,
  state,
  stateProperty,
}: {
  subject: HTMLElement;
  state: JointState<JSSObject>;
  stateProperty: keyof JointState<JSSObject>;
}) => {
  expect(subject).toHaveStyle(state[stateProperty]);
};

const toggleWithChecks = <T extends any>({
  subjectTestId,
  state,
  buttonTestId,
  handler,
}: {
  subjectTestId: string;
  state: JointState<T>;
  buttonTestId: string;
  handler: Checker<T>;
}) => {
  const { getByTestId } = render(<Index />);
  const subject = getByTestId(subjectTestId);
  const menuButton = getByTestId(buttonTestId);
  handler({ subject, state, stateProperty: "initial" });
  fireEvent.click(menuButton);
  handler({ subject, state, stateProperty: "toggled" });
  fireEvent.click(menuButton);
  handler({ subject, state, stateProperty: "initial" });
};

/* Tests
Every test has two main sections:
    1. If the component is rendered correctly
    2. If the component is functioning correctly (integration test)
*/
describe("Button Pane", () => {
  isBeingRenderedWithButtonPane({ testId: "buttonPane" });
});

describe("Menu Button", () => {
  isBeingRenderedWithButtonPane({ testId: "menuButton" });
  it("toggles the settings pane correctly when clicked", () => {
    toggleWithChecks({
      subjectTestId: "settingsPane",
      state: { initial: "open", toggled: "closed" },
      buttonTestId: "menuButton",
      handler: checkClassOfSubject,
    });
  });
});

describe("Dark Mode Button", () => {
  isBeingRenderedWithButtonPane({ testId: "darkModeButton" });

  const light = {
    backgroundColor: "#fff",
    color: "rgba(0, 0, 0, 0.87)",
  };

  const dark = {
    backgroundColor: "#121212",
    color: "#fff",
  };

  it("toggles the dark mode theme correctly when clicked", () => {
    toggleWithChecks({
      subjectTestId: "buttonPane",
      state: { initial: light, toggled: dark },
      buttonTestId: "darkModeButton",
      handler: checkStyleOfSubject,
    });
    // need to add all major components
  });
});

describe("Clear Layers Button", () => {
  isBeingRenderedWithButtonPane({ testId: "clearLayersButton" });
});

describe("Editor Layout Button", () => {
  isBeingRenderedWithButtonPane({ testId: "editorLayoutButton" });

  it("toggles the flex orientation of the textAreaContainer correctly when clicked", () => {
    toggleWithChecks({
      subjectTestId: "textAreaContainer",
      state: { initial: "row", toggled: "col" },
      buttonTestId: "editorLayoutButton",
      handler: checkClassOfSubject,
    });
  });
});

describe("Text Align Button", () => {
  isBeingRenderedWithButtonPane({ testId: "textAlignButton" });
});
