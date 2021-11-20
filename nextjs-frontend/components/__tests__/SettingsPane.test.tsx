import "@testing-library/jest-dom";

import { cleanup, render } from "@testing-library/react";

import React from "react";
import SettingsPane from "../SettingsPane";
import { isBeingRendered } from "./utils/utils";

afterEach(() => {
  cleanup();
});

// Common functions and interfaces used within settings pane
const isBeingRenderedWithSettingsPane = ({ testId }: { testId: string }) =>
  isBeingRendered({ testId, component: <SettingsPane /> });

describe("Settings Pane", () => {
  isBeingRenderedWithSettingsPane({ testId: "settingsPane" });
});

describe("Space Button", () => {
  // Render the index
  // get space button by test id
  // click on space button
  // verify that the clipboard has changed
  isBeingRenderedWithSettingsPane({ testId: "spaceButton" });
  const { getByTestId } = render(<></>);
  it("copies the current workspace ID to the clipboard when clicked", () => {});
});
