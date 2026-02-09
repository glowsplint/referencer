import { useRef, useEffect, useCallback } from "react"
import type { Layer } from "@/types/editor"

interface CanvasOverlayProps {
  layers: Layer[]
  containerRef: React.RefObject<HTMLDivElement | null>
}

export function CanvasOverlay({ layers, containerRef }: CanvasOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const { width, height } = container.getBoundingClientRect()
    canvas.width = width
    canvas.height = height
  }, [containerRef])

  useEffect(() => {
    resizeCanvas()
    const observer = new ResizeObserver(resizeCanvas)
    const container = containerRef.current
    if (container) observer.observe(container)
    return () => observer.disconnect()
  }, [resizeCanvas, containerRef])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-10 pointer-events-none"
      data-testid="canvasOverlay"
    />
  )
}
