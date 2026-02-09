import { useRef, useEffect, useCallback } from "react"
import type { Editor } from "@tiptap/react"
import type { Layer } from "@/types/editor"

interface CanvasOverlayProps {
  layers: Layer[]
  containerRef: React.RefObject<HTMLDivElement | null>
  editorsRef: React.RefObject<Map<number, Editor>>
  isLocked: boolean
  isLayersOn: boolean
}

export function CanvasOverlay({
  layers,
  containerRef,
  editorsRef,
  isLocked,
  isLayersOn,
}: CanvasOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  const drawHighlights = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (!isLocked || !isLayersOn) return

    const containerRect = container.getBoundingClientRect()

    for (const layer of layers) {
      if (layer.highlights.length === 0) continue

      // Parse hex colour and add ~30% alpha
      const color = layer.color
      const r = parseInt(color.slice(1, 3), 16)
      const g = parseInt(color.slice(3, 5), 16)
      const b = parseInt(color.slice(5, 7), 16)
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.3)`

      for (const highlight of layer.highlights) {
        const editor = editorsRef.current.get(highlight.editorIndex)
        if (!editor) continue

        try {
          const startCoords = editor.view.coordsAtPos(highlight.from)
          const endCoords = editor.view.coordsAtPos(highlight.to)

          const x = startCoords.left - containerRect.left
          const y = startCoords.top - containerRect.top
          const width = endCoords.right - startCoords.left
          const height = startCoords.bottom - startCoords.top

          // Only draw if within canvas bounds
          if (
            x + width > 0 &&
            x < canvas.width &&
            y + height > 0 &&
            y < canvas.height
          ) {
            ctx.fillRect(x, y, width, height)
          }
        } catch {
          // Position may be invalid if doc changed — skip
        }
      }
    }
  }, [layers, containerRef, editorsRef, isLocked, isLayersOn])

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const { width, height } = container.getBoundingClientRect()
    canvas.width = width
    canvas.height = height

    drawHighlights()
  }, [containerRef, drawHighlights])

  // Resize observer
  useEffect(() => {
    resizeCanvas()
    const observer = new ResizeObserver(resizeCanvas)
    const container = containerRef.current
    if (container) observer.observe(container)
    return () => observer.disconnect()
  }, [resizeCanvas, containerRef])

  // Redraw on highlight data changes
  useEffect(() => {
    drawHighlights()
  }, [drawHighlights])

  // Scroll listeners on editor wrappers
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(drawHighlights)
    }

    const wrappers = container.querySelectorAll(".simple-editor-wrapper")
    wrappers.forEach((el) => el.addEventListener("scroll", handleScroll))

    return () => {
      cancelAnimationFrame(rafRef.current)
      wrappers.forEach((el) => el.removeEventListener("scroll", handleScroll))
    }
  }, [containerRef, drawHighlights, layers])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-10 pointer-events-none"
      data-testid="canvasOverlay"
    />
  )
}
