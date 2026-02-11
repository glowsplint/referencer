import { useEffect, useRef, useState, useCallback } from "react"
import { WorkspaceWSClient } from "@/lib/ws-client"
import type { ServerMessage, WorkspaceStatePayload } from "@/lib/ws-protocol"
import type { Layer } from "@/types/editor"
import type { useLayers } from "./use-layers"
import type { useEditors } from "./use-editors"

type RawLayersHook = ReturnType<typeof useLayers>
type RawEditorsHook = ReturnType<typeof useEditors>

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
      const state = msg.payload as unknown as WorkspaceStatePayload
      hydrateState(state, rawLayersRef.current, rawEditorsRef.current)
    })

    client.on("action", (msg: ServerMessage) => {
      applyRemoteAction(
        msg.payload as Record<string, unknown>,
        rawLayersRef.current,
        rawEditorsRef.current
      )
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
  }
}
