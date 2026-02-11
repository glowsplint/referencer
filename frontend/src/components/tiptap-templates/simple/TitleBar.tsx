import { useCallback, useEffect, useRef, useState } from "react"

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/tiptap-ui-primitive/tooltip"

export function TitleBar() {
  const [title, setTitle] = useState("Title")
  const [isEditing, setIsEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const startEditing = useCallback(() => {
    setIsEditing(true)
  }, [])

  const stopEditing = useCallback(() => {
    setIsEditing(false)
    if (title.trim() === "") {
      setTitle("Title")
    }
  }, [title])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === "Escape") {
        e.preventDefault()
        inputRef.current?.blur()
      }
    },
    []
  )

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  return (
    <div className="flex items-center px-4 py-2 border-b border-[var(--tt-border-color-tint)] bg-[var(--tt-bg-color)] shrink-0">
      {isEditing ? (
        <input
          ref={inputRef}
          className="text-sm font-medium font-[inherit] text-[var(--tt-theme-text)] px-2 py-1 rounded-md border border-[var(--tt-brand-color-400)] outline-none bg-transparent min-w-[100px]"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={stopEditing}
          onKeyDown={handleKeyDown}
          spellCheck={false}
        />
      ) : (
        <Tooltip placement="bottom" delay={300}>
          <TooltipTrigger asChild>
            <div
              className="text-sm font-medium text-[var(--tt-theme-text)] px-2 py-1 rounded-md border border-transparent cursor-text select-none transition-[border-color] duration-150 hover:border-[var(--tt-border-color)]"
              onClick={startEditing}
            >
              {title}
            </div>
          </TooltipTrigger>
          <TooltipContent>Rename</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
