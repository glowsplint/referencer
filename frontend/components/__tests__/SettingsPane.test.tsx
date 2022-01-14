import "@testing-library/jest-dom";

import React from "react";
import SettingsPane from "../SettingsPane";
import { isBeingRendered } from "./utils/utils";

// Common functions and interfaces used within settings pane
const isBeingRenderedWithSettingsPane = ({ testId }: { testId: string }) =>
  isBeingRendered({ testId, component: <SettingsPane /> });

describe("Space Button", () => {
  isBeingRenderedWithSettingsPane({ testId: "spaceButton" });
  it("copies the current workspace ID to the clipboard when clicked", () => {});
});

describe("Texts Section", () => {
  isBeingRenderedWithSettingsPane({ testId: "textsSectionHeader" });
  it("has a new entry added when I submit a new text in the search bar", () => {});
});

describe("Clear Annotations Button", () => {
  isBeingRenderedWithSettingsPane({ testId: "clearAnnotationsButton" });
  it("clears all annotations (highlights & arrows) when I click on it", () => {});
});

describe("Edit Name", () => {
  it("changes & reflects my name correctly when I edit it in settings", () => {});
});
