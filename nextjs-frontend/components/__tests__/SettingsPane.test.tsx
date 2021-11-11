import "@testing-library/jest-dom";

import React from "react";
import SettingsPane from "../SettingsPane";
import { cleanup } from "@testing-library/react";
import { isBeingRendered } from "./utils/utils";

afterEach(() => {
  cleanup();
});

// Common functions and interfaces used within settings pane
const isBeingRenderedWithSettingsPane = ({ testId }: { testId: string }) =>
  isBeingRendered({ testId, component: <SettingsPane /> });

describe("Settings Pane", () => {
  isBeingRenderedWithSettingsPane({ testId: "settingsPane" });
  it("toggles the settings pane correctly when clicked", () => {});
});
