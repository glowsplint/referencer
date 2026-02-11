import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  validateStatePayload,
  validateActionPayload,
} from "./use-websocket"

beforeEach(() => {
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// validateStatePayload
// ---------------------------------------------------------------------------

describe("validateStatePayload", () => {
  const validState = {
    workspaceId: "ws-1",
    layers: [
      {
        id: "l1",
        name: "Layer 1",
        color: "#ff0000",
        visible: true,
        highlights: [],
        arrows: [],
      },
    ],
    editors: [{ index: 0, name: "Editor 1", visible: true, contentJson: null }],
  }

  it("accepts a valid state payload", () => {
    expect(validateStatePayload(validState)).toBe(true)
  })

  it("accepts a state with empty layers and editors", () => {
    expect(
      validateStatePayload({ workspaceId: "ws-1", layers: [], editors: [] })
    ).toBe(true)
  })

  it("rejects null", () => {
    expect(validateStatePayload(null)).toBe(false)
  })

  it("rejects a non-object", () => {
    expect(validateStatePayload("string")).toBe(false)
    expect(validateStatePayload(42)).toBe(false)
    expect(validateStatePayload(undefined)).toBe(false)
  })

  it("rejects when workspaceId is missing", () => {
    const { workspaceId: _, ...rest } = validState
    expect(validateStatePayload(rest)).toBe(false)
  })

  it("rejects when workspaceId is wrong type", () => {
    expect(validateStatePayload({ ...validState, workspaceId: 123 })).toBe(false)
  })

  it("rejects when layers is not an array", () => {
    expect(validateStatePayload({ ...validState, layers: "nope" })).toBe(false)
  })

  it("rejects when editors is not an array", () => {
    expect(validateStatePayload({ ...validState, editors: null })).toBe(false)
  })

  it("rejects when a layer is missing required fields", () => {
    expect(
      validateStatePayload({
        ...validState,
        layers: [{ id: "l1" }], // missing name, color, visible, highlights, arrows
      })
    ).toBe(false)
  })

  it("rejects when a layer has wrong type for visible", () => {
    expect(
      validateStatePayload({
        ...validState,
        layers: [
          {
            id: "l1",
            name: "Layer",
            color: "#000",
            visible: "yes", // should be boolean
            highlights: [],
            arrows: [],
          },
        ],
      })
    ).toBe(false)
  })

  it("rejects when a layer highlights is not an array", () => {
    expect(
      validateStatePayload({
        ...validState,
        layers: [
          {
            id: "l1",
            name: "Layer",
            color: "#000",
            visible: true,
            highlights: "nope",
            arrows: [],
          },
        ],
      })
    ).toBe(false)
  })

  it("rejects when an editor is missing name", () => {
    expect(
      validateStatePayload({
        ...validState,
        editors: [{ visible: true }],
      })
    ).toBe(false)
  })

  it("rejects when an editor is missing visible", () => {
    expect(
      validateStatePayload({
        ...validState,
        editors: [{ name: "Ed" }],
      })
    ).toBe(false)
  })

  it("rejects when an editor entry is not an object", () => {
    expect(
      validateStatePayload({
        ...validState,
        editors: ["bad"],
      })
    ).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// validateActionPayload
// ---------------------------------------------------------------------------

describe("validateActionPayload", () => {
  it("rejects payload without actionType", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    expect(validateActionPayload({})).toBe(false)
    expect(warnSpy).toHaveBeenCalled()
  })

  it("rejects payload with non-string actionType", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    expect(validateActionPayload({ actionType: 42 })).toBe(false)
    expect(warnSpy).toHaveBeenCalled()
  })

  // -- addLayer --
  it("validates addLayer", () => {
    expect(
      validateActionPayload({ actionType: "addLayer", id: "l1", name: "L", color: "#f00" })
    ).toBe(true)
  })

  it("rejects addLayer missing color", () => {
    expect(
      validateActionPayload({ actionType: "addLayer", id: "l1", name: "L" })
    ).toBe(false)
  })

  // -- removeLayer --
  it("validates removeLayer", () => {
    expect(validateActionPayload({ actionType: "removeLayer", id: "l1" })).toBe(true)
  })

  it("rejects removeLayer missing id", () => {
    expect(validateActionPayload({ actionType: "removeLayer" })).toBe(false)
  })

  // -- updateLayerName --
  it("validates updateLayerName", () => {
    expect(
      validateActionPayload({ actionType: "updateLayerName", id: "l1", name: "New" })
    ).toBe(true)
  })

  it("rejects updateLayerName missing name", () => {
    expect(
      validateActionPayload({ actionType: "updateLayerName", id: "l1" })
    ).toBe(false)
  })

  // -- updateLayerColor --
  it("validates updateLayerColor", () => {
    expect(
      validateActionPayload({ actionType: "updateLayerColor", id: "l1", color: "#0f0" })
    ).toBe(true)
  })

  it("rejects updateLayerColor with numeric color", () => {
    expect(
      validateActionPayload({ actionType: "updateLayerColor", id: "l1", color: 123 })
    ).toBe(false)
  })

  // -- toggleLayerVisibility --
  it("validates toggleLayerVisibility", () => {
    expect(
      validateActionPayload({ actionType: "toggleLayerVisibility", id: "l1" })
    ).toBe(true)
  })

  // -- reorderLayers --
  it("validates reorderLayers", () => {
    expect(
      validateActionPayload({ actionType: "reorderLayers", layerIds: ["a", "b", "c"] })
    ).toBe(true)
  })

  it("rejects reorderLayers with non-string ids", () => {
    expect(
      validateActionPayload({ actionType: "reorderLayers", layerIds: [1, 2] })
    ).toBe(false)
  })

  it("rejects reorderLayers when layerIds is not array", () => {
    expect(
      validateActionPayload({ actionType: "reorderLayers", layerIds: "abc" })
    ).toBe(false)
  })

  // -- addHighlight --
  it("validates addHighlight", () => {
    expect(
      validateActionPayload({
        actionType: "addHighlight",
        layerId: "l1",
        highlight: { id: "h1", editorIndex: 0, from: 5, to: 10 },
      })
    ).toBe(true)
  })

  it("rejects addHighlight missing layerId", () => {
    expect(
      validateActionPayload({
        actionType: "addHighlight",
        highlight: { id: "h1", editorIndex: 0, from: 5, to: 10 },
      })
    ).toBe(false)
  })

  it("rejects addHighlight when highlight is not an object", () => {
    expect(
      validateActionPayload({ actionType: "addHighlight", layerId: "l1", highlight: "bad" })
    ).toBe(false)
  })

  it("rejects addHighlight missing from in highlight", () => {
    expect(
      validateActionPayload({
        actionType: "addHighlight",
        layerId: "l1",
        highlight: { id: "h1", editorIndex: 0, to: 10 },
      })
    ).toBe(false)
  })

  // -- removeHighlight --
  it("validates removeHighlight", () => {
    expect(
      validateActionPayload({
        actionType: "removeHighlight",
        layerId: "l1",
        highlightId: "h1",
      })
    ).toBe(true)
  })

  it("rejects removeHighlight missing highlightId", () => {
    expect(
      validateActionPayload({ actionType: "removeHighlight", layerId: "l1" })
    ).toBe(false)
  })

  // -- updateHighlightAnnotation --
  it("validates updateHighlightAnnotation", () => {
    expect(
      validateActionPayload({
        actionType: "updateHighlightAnnotation",
        layerId: "l1",
        highlightId: "h1",
        annotation: "note",
      })
    ).toBe(true)
  })

  it("rejects updateHighlightAnnotation missing annotation", () => {
    expect(
      validateActionPayload({
        actionType: "updateHighlightAnnotation",
        layerId: "l1",
        highlightId: "h1",
      })
    ).toBe(false)
  })

  // -- addArrow --
  it("validates addArrow", () => {
    expect(
      validateActionPayload({
        actionType: "addArrow",
        layerId: "l1",
        arrow: {
          id: "a1",
          from: { editorIndex: 0, from: 0, to: 5, text: "hi" },
          to: { editorIndex: 1, from: 0, to: 5, text: "there" },
        },
      })
    ).toBe(true)
  })

  it("rejects addArrow when arrow is missing", () => {
    expect(
      validateActionPayload({ actionType: "addArrow", layerId: "l1" })
    ).toBe(false)
  })

  it("rejects addArrow when arrow.from is not an object", () => {
    expect(
      validateActionPayload({
        actionType: "addArrow",
        layerId: "l1",
        arrow: { id: "a1", from: "bad", to: {} },
      })
    ).toBe(false)
  })

  // -- removeArrow --
  it("validates removeArrow", () => {
    expect(
      validateActionPayload({ actionType: "removeArrow", layerId: "l1", arrowId: "a1" })
    ).toBe(true)
  })

  it("rejects removeArrow missing arrowId", () => {
    expect(
      validateActionPayload({ actionType: "removeArrow", layerId: "l1" })
    ).toBe(false)
  })

  // -- addEditor --
  it("validates addEditor", () => {
    expect(validateActionPayload({ actionType: "addEditor", name: "New" })).toBe(true)
  })

  it("rejects addEditor missing name", () => {
    expect(validateActionPayload({ actionType: "addEditor" })).toBe(false)
  })

  // -- removeEditor --
  it("validates removeEditor", () => {
    expect(validateActionPayload({ actionType: "removeEditor", index: 2 })).toBe(true)
  })

  it("rejects removeEditor with string index", () => {
    expect(validateActionPayload({ actionType: "removeEditor", index: "2" })).toBe(false)
  })

  // -- updateSectionName --
  it("validates updateSectionName", () => {
    expect(
      validateActionPayload({ actionType: "updateSectionName", index: 0, name: "Sec" })
    ).toBe(true)
  })

  it("rejects updateSectionName missing name", () => {
    expect(
      validateActionPayload({ actionType: "updateSectionName", index: 0 })
    ).toBe(false)
  })

  // -- toggleSectionVisibility --
  it("validates toggleSectionVisibility", () => {
    expect(
      validateActionPayload({ actionType: "toggleSectionVisibility", index: 1 })
    ).toBe(true)
  })

  it("rejects toggleSectionVisibility missing index", () => {
    expect(
      validateActionPayload({ actionType: "toggleSectionVisibility" })
    ).toBe(false)
  })

  // -- unknown action type passes through --
  it("allows unknown action types through", () => {
    expect(
      validateActionPayload({ actionType: "someFutureAction", data: 42 })
    ).toBe(true)
  })
})
