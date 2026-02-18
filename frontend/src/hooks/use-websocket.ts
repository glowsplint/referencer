// WebSocket integration for real-time collaborative editing.
// Connects to the workspace server, hydrates initial state on connect,
// and applies remote actions (layer/editor mutations) as they arrive.
// Includes payload validation to guard against malformed messages.
import { useEffect, useRef, useState, useCallback } from "react"
import { WorkspaceWSClient } from "@/lib/ws-client"
import type { ServerMessage, WorkspaceStatePayload } from "@/lib/ws-protocol"
import type { Layer, ArrowStyle } from "@/types/editor"
import type { useLayers } from "./use-layers"
import type { useEditors } from "./use-editors"

type RawLayersHook = ReturnType<typeof useLayers>
type RawEditorsHook = ReturnType<typeof useEditors>

// ---------------------------------------------------------------------------
// Payload validation helpers
// ---------------------------------------------------------------------------

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

function isString(v: unknown): v is string {
  return typeof v === "string"
}

function isNumber(v: unknown): v is number {
  return typeof v === "number"
}

function isBoolean(v: unknown): v is boolean {
  return typeof v === "boolean"
}

/** Validate that `data` looks like a WorkspaceStatePayload. */
export function validateStatePayload(
  data: unknown
): data is WorkspaceStatePayload {
  if (!isObject(data)) return false
  if (!isString(data.workspaceId)) return false
  if (!Array.isArray(data.layers)) return false
  if (!Array.isArray(data.editors)) return false

  for (const l of data.layers) {
    if (!isObject(l)) return false
    if (!isString(l.id) || !isString(l.name) || !isString(l.color) || !isBoolean(l.visible))
      return false
    if (!Array.isArray(l.highlights) || !Array.isArray(l.arrows)) return false
  }

  for (const e of data.editors) {
    if (!isObject(e)) return false
    if (!isString(e.name) || !isBoolean(e.visible)) return false
  }

  return true
}

/** Validate fields required for each remote action type. Returns true if valid. */
export function validateActionPayload(payload: Record<string, unknown>): boolean {
  const t = payload.actionType
  if (!isString(t)) {
    console.warn("[ws] action payload missing actionType", payload)
    return false
  }

  switch (t) {
    case "addLayer":
      return isString(payload.id) && isString(payload.name) && isString(payload.color)

    case "removeLayer":
      return isString(payload.id)

    case "updateLayerName":
      return isString(payload.id) && isString(payload.name)

    case "updateLayerColor":
      return isString(payload.id) && isString(payload.color)

    case "toggleLayerVisibility":
      return isString(payload.id)

    case "reorderLayers":
      return Array.isArray(payload.layerIds) && payload.layerIds.every(isString)

    case "addHighlight": {
      if (!isString(payload.layerId) || !isObject(payload.highlight)) return false
      const h = payload.highlight
      return (
        isString(h.id) && isNumber(h.editorIndex) && isNumber(h.from) && isNumber(h.to)
      )
    }

    case "removeHighlight":
      return isString(payload.layerId) && isString(payload.highlightId)

    case "updateHighlightAnnotation":
      return (
        isString(payload.layerId) &&
        isString(payload.highlightId) &&
        isString(payload.annotation)
      )

    case "addArrow": {
      if (!isString(payload.layerId) || !isObject(payload.arrow)) return false
      const a = payload.arrow
      return isString(a.id) && isObject(a.from) && isObject(a.to)
    }

    case "removeArrow":
      return isString(payload.layerId) && isString(payload.arrowId)

    case "updateArrowStyle":
      return (
        isString(payload.layerId) &&
        isString(payload.arrowId) &&
        isString(payload.arrowStyle)
      )

    case "addUnderline": {
      if (!isString(payload.layerId) || !isObject(payload.underline)) return false
      const u = payload.underline
      return (
        isString(u.id) && isNumber(u.editorIndex) && isNumber(u.from) && isNumber(u.to)
      )
    }

    case "removeUnderline":
      return isString(payload.layerId) && isString(payload.underlineId)

    case "addEditor":
      return isString(payload.name)

    case "removeEditor":
      return isNumber(payload.index)

    case "updateSectionName":
      return isNumber(payload.index) && isString(payload.name)

    case "toggleSectionVisibility":
      return isNumber(payload.index)

    case "reorderEditors":
      return Array.isArray(payload.permutation) && payload.permutation.every(isNumber)

    default:
      // Unknown action — let it through; the switch in applyRemoteAction will ignore it
      return true
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWebSocket(
  workspaceId: string | null,
  rawLayers: RawLayersHook,
  rawEditors: RawEditorsHook
) {
  const [connected, setConnected] = useState(false)
  const clientRef = useRef<WorkspaceWSClient | null>(null)

  // Keep refs to raw hooks so handlers don't go stale
  const rawLayersRef = useRef(rawLayers)
  rawLayersRef.current = rawLayers
  const rawEditorsRef = useRef(rawEditors)
  rawEditorsRef.current = rawEditors

  const sendAction = useCallback(
    (type: string, payload: Record<string, unknown>) => {
      clientRef.current?.send(type, payload)
    },
    []
  )

  useEffect(() => {
    if (!workspaceId) return

    const client = new WorkspaceWSClient(workspaceId)
    clientRef.current = client

    client.on("_connected", () => setConnected(true))
    client.on("_disconnected", () => setConnected(false))

    client.on("state", (msg: ServerMessage) => {
      try {
        if (!validateStatePayload(msg.payload)) {
          console.warn("[ws] Invalid state payload, skipping hydration", msg.payload)
          return
        }
        hydrateState(msg.payload, rawLayersRef.current, rawEditorsRef.current)
      } catch (err) {
        console.error("[ws] Unexpected error hydrating state", err, msg.payload)
      }
    })

    client.on("action", (msg: ServerMessage) => {
      try {
        const payload = msg.payload as Record<string, unknown>
        if (!validateActionPayload(payload)) {
          console.warn("[ws] Invalid action payload, skipping", payload)
          return
        }
        applyRemoteAction(payload, rawLayersRef.current, rawEditorsRef.current)
      } catch (err) {
        console.error("[ws] Unexpected error applying remote action", err, payload)
      }
    })

    client.connect()

    return () => {
      client.disconnect()
      clientRef.current = null
    }
  }, [workspaceId])

  return { connected, sendAction }
}

function hydrateState(
  state: WorkspaceStatePayload,
  rawLayers: RawLayersHook,
  rawEditors: RawEditorsHook
) {
  // Hydrate layers
  const layers: Layer[] = state.layers.map((l) => ({
    id: l.id,
    name: l.name,
    color: l.color,
    visible: l.visible,
    highlights: l.highlights.map((h) => ({
      id: h.id,
      editorIndex: h.editorIndex,
      from: h.from,
      to: h.to,
      text: h.text,
      annotation: h.annotation,
      type: (h.type as "highlight" | "comment") ?? "comment",
    })),
    arrows: l.arrows.map((a) => ({
      id: a.id,
      from: {
        editorIndex: a.from.editorIndex,
        from: a.from.from,
        to: a.from.to,
        text: a.from.text,
      },
      to: {
        editorIndex: a.to.editorIndex,
        from: a.to.from,
        to: a.to.to,
        text: a.to.text,
      },
      arrowStyle: ((a.arrowStyle as string) ?? "solid") as ArrowStyle,
    })),
    underlines: (l.underlines as Array<Record<string, unknown>> ?? []).map((u) => ({
      id: u.id as string,
      editorIndex: u.editorIndex as number,
      from: u.from as number,
      to: u.to as number,
      text: u.text as string,
    })),
  }))
  rawLayers.setLayers(layers)
  if (layers.length > 0 && !rawLayers.activeLayerId) {
    rawLayers.setActiveLayerId(layers[0].id)
  }

  // Hydrate editors
  const names = state.editors.map((e) => e.name)
  const visibility = state.editors.map((e) => e.visible)
  if (names.length > 0) {
    rawEditors.setSectionNames(names)
    rawEditors.setSectionVisibility(visibility)
    rawEditors.setEditorCount(state.editors.length)
  }
}

function applyRemoteAction(
  payload: Record<string, unknown>,
  rawLayers: RawLayersHook,
  rawEditors: RawEditorsHook
) {
  const actionType = payload.actionType as string

  switch (actionType) {
    case "addLayer":
      rawLayers.addLayer({
        id: payload.id as string,
        name: payload.name as string,
        color: payload.color as string,
      })
      break

    case "removeLayer":
      rawLayers.removeLayer(payload.id as string)
      break

    case "updateLayerName":
      rawLayers.updateLayerName(payload.id as string, payload.name as string)
      break

    case "updateLayerColor":
      rawLayers.updateLayerColor(payload.id as string, payload.color as string)
      break

    case "toggleLayerVisibility":
      rawLayers.toggleLayerVisibility(payload.id as string)
      break

    case "reorderLayers": {
      const layerIds = payload.layerIds as string[]
      rawLayers.setLayers((prev) => {
        const map = new Map(prev.map((l) => [l.id, l]))
        return layerIds.map((id) => map.get(id)!).filter(Boolean)
      })
      break
    }

    case "addHighlight": {
      const h = payload.highlight as Record<string, unknown>
      rawLayers.addHighlight(
        payload.layerId as string,
        {
          editorIndex: h.editorIndex as number,
          from: h.from as number,
          to: h.to as number,
          text: (h.text as string) ?? "",
          annotation: (h.annotation as string) ?? "",
          type: (h.type as "highlight" | "comment") || "comment",
        },
        { id: h.id as string }
      )
      break
    }

    case "removeHighlight":
      rawLayers.removeHighlight(
        payload.layerId as string,
        payload.highlightId as string
      )
      break

    case "updateHighlightAnnotation":
      rawLayers.updateHighlightAnnotation(
        payload.layerId as string,
        payload.highlightId as string,
        payload.annotation as string
      )
      break

    case "addArrow": {
      const arrow = payload.arrow as Record<string, unknown>
      rawLayers.addArrow(
        payload.layerId as string,
        {
          from: arrow.from as { editorIndex: number; from: number; to: number; text: string },
          to: arrow.to as { editorIndex: number; from: number; to: number; text: string },
          arrowStyle: ((arrow.arrowStyle as string) ?? "solid") as ArrowStyle,
        },
        { id: arrow.id as string }
      )
      break
    }

    case "removeArrow":
      rawLayers.removeArrow(
        payload.layerId as string,
        payload.arrowId as string
      )
      break

    case "updateArrowStyle":
      rawLayers.updateArrowStyle(
        payload.layerId as string,
        payload.arrowId as string,
        payload.arrowStyle as ArrowStyle
      )
      break

    case "addUnderline": {
      const u = payload.underline as Record<string, unknown>
      rawLayers.addUnderline(
        payload.layerId as string,
        {
          editorIndex: u.editorIndex as number,
          from: u.from as number,
          to: u.to as number,
          text: (u.text as string) ?? "",
        },
        { id: u.id as string }
      )
      break
    }

    case "removeUnderline":
      rawLayers.removeUnderline(
        payload.layerId as string,
        payload.underlineId as string
      )
      break

    case "addEditor":
      rawEditors.addEditor({ name: payload.name as string })
      break

    case "removeEditor":
      rawEditors.removeEditor(payload.index as number)
      break

    case "updateSectionName":
      rawEditors.updateSectionName(
        payload.index as number,
        payload.name as string
      )
      break

    case "toggleSectionVisibility":
      rawEditors.toggleSectionVisibility(payload.index as number)
      break

    case "reorderEditors": {
      const permutation = payload.permutation as number[]
      // Build index map for layer remapping
      const indexMap = new Map<number, number>()
      for (let newIdx = 0; newIdx < permutation.length; newIdx++) {
        indexMap.set(permutation[newIdx], newIdx)
      }
      rawEditors.reorderEditors(permutation)
      rawLayers.setLayers(prev =>
        prev.map(layer => ({
          ...layer,
          highlights: layer.highlights.map(h => ({
            ...h,
            editorIndex: indexMap.get(h.editorIndex) ?? h.editorIndex,
          })),
          arrows: layer.arrows.map(a => ({
            ...a,
            from: { ...a.from, editorIndex: indexMap.get(a.from.editorIndex) ?? a.from.editorIndex },
            to: { ...a.to, editorIndex: indexMap.get(a.to.editorIndex) ?? a.to.editorIndex },
          })),
          underlines: layer.underlines.map(u => ({
            ...u,
            editorIndex: indexMap.get(u.editorIndex) ?? u.editorIndex,
          })),
        }))
      )
      break
    }
  }
}
