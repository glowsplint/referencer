import { useRef, useEffect, useCallback } from "react"

interface AnnotationCardProps {
  layerId: string
  highlightId: string
  color: string
  annotation: string
  isEditing: boolean
  top: number
  onChange: (layerId: string, highlightId: string, annotation: string) => void
  onBlur: () => void
  onClick: (layerId: string, highlightId: string) => void
}

export function AnnotationCard({
  layerId,
  highlightId,
  color,
  annotation,
  isEditing,
  top,
  onChange,
  onBlur,
  onClick,
}: AnnotationCardProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isEditing])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(layerId, highlightId, e.target.value)
    },
    [layerId, highlightId, onChange]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        onBlur()
      }
      // Stop propagation so arrow keys don't trigger word navigation
      e.stopPropagation()
    },
    [onBlur]
  )

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!isEditing) {
        onClick(layerId, highlightId)
      }
    },
    [isEditing, layerId, highlightId, onClick]
  )

  return (
    <div
      className="absolute w-48 rounded border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
      style={{ top }}
      onClick={handleClick}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
    >
      <div className="h-1 rounded-t" style={{ backgroundColor: color }} />
      {isEditing ? (
        <textarea
          ref={textareaRef}
          className="w-full resize-none border-0 bg-transparent p-2 text-xs outline-none dark:text-zinc-200"
          rows={2}
          value={annotation}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={onBlur}
          placeholder="Add annotation..."
        />
      ) : (
        <div className="cursor-pointer p-2 text-xs text-zinc-600 dark:text-zinc-300 min-h-[2rem]">
          {annotation || <span className="text-zinc-400 italic">Add annotation...</span>}
        </div>
      )}
    </div>
  )
}
