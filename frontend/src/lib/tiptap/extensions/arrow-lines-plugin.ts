// ProseMirror plugin that renders annotation arrows as an SVG overlay
// inside each editor's scroll wrapper. Draws styled paths (solid, dashed,
// dotted, double) between word centers with directional arrowhead markers.
// Interaction (hover, click-to-delete) is handled separately by ArrowOverlay.
import { Extension } from "@tiptap/core"
import { Plugin, PluginKey, type EditorState } from "@tiptap/pm/state"
import type { EditorView } from "@tiptap/pm/view"
import type { ArrowEndpoint, ArrowStyle } from "@/types/editor"
import { getWordCenterContentRelative } from "@/lib/tiptap/nearest-word"
import { getArrowStyleAttrs, computeDoubleLinePaths } from "@/lib/arrow-styles"

const ARROW_OPACITY = 0.6
const SVG_NS = "http://www.w3.org/2000/svg"

export const arrowLinesPluginKey = new PluginKey("arrowLines")

/** Module-level store so React hooks can access plugin view instances */
const viewInstances = new WeakMap<EditorView, ArrowLinesView>()

export function getArrowLinesView(view: EditorView): ArrowLinesView | undefined {
  return viewInstances.get(view)
}

export interface ArrowData {
  layerId: string
  arrowId: string
  color: string
  arrowStyle: ArrowStyle
  from: ArrowEndpoint
  to: ArrowEndpoint
}

/**
 * Visual-only rendering of within-editor arrows.
 * The SVG is placed inside .simple-editor-wrapper so it scrolls with content.
 * Interaction (hit areas, hover, X icon, click-to-delete) is handled by
 * ArrowOverlay's interaction layer at the container level.
 */
export class ArrowLinesView {
  private visualSvg: SVGSVGElement
  private wrapper: HTMLElement | null = null
  private view: EditorView
  private arrows: ArrowData[] = []
  private hoveredArrowId: string | null = null
  private selectedArrowId: string | null = null
  private resizeObserver: ResizeObserver | null = null

  constructor(view: EditorView) {
    this.view = view
    viewInstances.set(view, this)

    this.visualSvg = document.createElementNS(SVG_NS, "svg")
    this.visualSvg.setAttribute("data-testid", "editor-arrow-visual")
    this.visualSvg.style.position = "absolute"
    this.visualSvg.style.top = "0"
    this.visualSvg.style.left = "0"
    this.visualSvg.style.pointerEvents = "none"
    this.visualSvg.style.zIndex = "10"

    // Try to attach now; if DOM not yet mounted by React, ensureWrapper() retries later
    this.ensureWrapper()
  }

  /** Lazily attach SVG to wrapper (plugin view is created before React mounts the DOM) */
  private ensureWrapper(): boolean {
    if (this.wrapper) return true
    this.wrapper = this.view.dom.closest(".simple-editor-wrapper") as HTMLElement | null
    if (!this.wrapper) return false

    this.wrapper.appendChild(this.visualSvg)
    this.updateSvgSize()

    this.resizeObserver = new ResizeObserver(() => {
      this.updateSvgSize()
      this.redraw()
    })
    this.resizeObserver.observe(this.wrapper)
    return true
  }

  private updateSvgSize() {
    if (!this.wrapper) return
    this.visualSvg.style.width = `${this.wrapper.scrollWidth}px`
    this.visualSvg.style.height = `${this.wrapper.scrollHeight}px`
  }

  update(view: EditorView, prevState: EditorState) {
    this.view = view
    viewInstances.set(view, this)
    this.ensureWrapper()
    if (!prevState.doc.eq(view.state.doc)) {
      this.updateSvgSize()
      this.redraw()
    }
  }

  setArrows(arrows: ArrowData[]) {
    this.arrows = arrows
    this.ensureWrapper()
    this.redraw()
  }

  setDarkMode(isDarkMode: boolean) {
    this.ensureWrapper()
    this.visualSvg.style.mixBlendMode = isDarkMode ? "screen" : "multiply"
    this.redraw()
  }

  setHoveredArrowId(arrowId: string | null) {
    if (this.hoveredArrowId === arrowId) return
    this.hoveredArrowId = arrowId
    this.redraw()
  }

  setSelectedArrowId(arrowId: string | null) {
    if (this.selectedArrowId === arrowId) return
    this.selectedArrowId = arrowId
    this.redraw()
  }

  private redraw() {
    if (!this.ensureWrapper()) return

    while (this.visualSvg.firstChild) this.visualSvg.removeChild(this.visualSvg.firstChild)
    this.updateSvgSize()

    const editorView = this.view
    const wrapper = this.wrapper!
    const defs = document.createElementNS(SVG_NS, "defs")

    for (const arrow of this.arrows) {
      const fromCenter = getWordCenterContentRelative(arrow.from, editorView, wrapper)
      const toCenter = getWordCenterContentRelative(arrow.to, editorView, wrapper)
      if (!fromCenter || !toCenter) continue

      const { cx: x1, cy: y1 } = fromCenter
      const { cx: x2, cy: y2 } = toCenter
      const mx = (x1 + x2) / 2
      const my = (y1 + y2) / 2
      const arrowPath = `M ${x1} ${y1} L ${mx} ${my} L ${x2} ${y2}`
      const hideMarker = this.selectedArrowId === arrow.arrowId

      // Marker (arrowhead)
      const marker = document.createElementNS(SVG_NS, "marker")
      marker.setAttribute("id", `arrowhead-${arrow.arrowId}`)
      marker.setAttribute("markerWidth", "8")
      marker.setAttribute("markerHeight", "6")
      marker.setAttribute("refX", "4")
      marker.setAttribute("refY", "3")
      marker.setAttribute("orient", "auto")
      const polygon = document.createElementNS(SVG_NS, "polygon")
      polygon.setAttribute("points", "0 0, 8 3, 0 6")
      polygon.setAttribute("fill", arrow.color)
      marker.appendChild(polygon)
      defs.appendChild(marker)

      // Visual arrow path(s)
      const g = document.createElementNS(SVG_NS, "g")
      g.setAttribute("opacity", String(ARROW_OPACITY))
      const styleAttrs = getArrowStyleAttrs(arrow.arrowStyle)

      if (styleAttrs.isDouble) {
        const [pathA, pathB] = computeDoubleLinePaths(x1, y1, mx, my, x2, y2)
        for (const d of [pathA, pathB]) {
          const p = document.createElementNS(SVG_NS, "path")
          p.setAttribute("data-testid", "arrow-line")
          p.setAttribute("d", d)
          p.setAttribute("stroke", arrow.color)
          p.setAttribute("stroke-width", String(styleAttrs.strokeWidth))
          p.setAttribute("fill", "none")
          g.appendChild(p)
        }
        // Marker on a center path (invisible, just for the arrowhead)
        if (!hideMarker) {
          const markerPath = document.createElementNS(SVG_NS, "path")
          markerPath.setAttribute("d", arrowPath)
          markerPath.setAttribute("stroke", "none")
          markerPath.setAttribute("fill", "none")
          markerPath.setAttribute("marker-mid", `url(#arrowhead-${arrow.arrowId})`)
          g.appendChild(markerPath)
        }
      } else {
        const path = document.createElementNS(SVG_NS, "path")
        path.setAttribute("data-testid", "arrow-line")
        path.setAttribute("d", arrowPath)
        path.setAttribute("stroke", arrow.color)
        path.setAttribute("stroke-width", String(styleAttrs.strokeWidth))
        path.setAttribute("fill", "none")
        if (styleAttrs.strokeDasharray) {
          path.setAttribute("stroke-dasharray", styleAttrs.strokeDasharray)
        }
        if (!hideMarker) {
          path.setAttribute("marker-mid", `url(#arrowhead-${arrow.arrowId})`)
        }
        g.appendChild(path)
      }
      this.visualSvg.appendChild(g)
    }

    if (defs.children.length > 0) {
      this.visualSvg.insertBefore(defs, this.visualSvg.firstChild)
    }
  }

  destroy() {
    this.resizeObserver?.disconnect()
    this.visualSvg.remove()
    viewInstances.delete(this.view)
  }
}

export const ArrowLinesExtension = Extension.create({
  name: "arrowLines",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: arrowLinesPluginKey,
        view(editorView) {
          return new ArrowLinesView(editorView)
        },
      }),
    ]
  },
})
