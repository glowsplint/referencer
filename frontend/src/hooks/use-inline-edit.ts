// Provides inline text editing state (start, commit, cancel) and input props
// for renaming items like layer names or section names in-place.
import { useEffect, useRef, useState } from "react"

interface UseInlineEditOptions {
  currentName: string
  onCommit: (name: string) => void
}

export function useInlineEdit({ currentName, onCommit }: UseInlineEditOptions) {
  const [isEditing, setIsEditing] = useState(false)
  const [editingValue, setEditingValue] = useState("")
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [isEditing])

  const startEditing = (nameOverride?: string) => {
    setIsEditing(true)
    setEditingValue(nameOverride ?? currentName)
  }

  const commitEdit = () => {
    const trimmed = editingValue.trim()
    onCommit(trimmed || currentName)
    setIsEditing(false)
  }

  const cancelEdit = () => {
    setIsEditing(false)
  }

  const inputProps = {
    ref: editInputRef,
    value: editingValue,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEditingValue(e.target.value),
    onBlur: commitEdit,
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") commitEdit()
      if (e.key === "Escape") cancelEdit()
    },
  }

  return {
    isEditing,
    editingValue,
    editInputRef,
    startEditing,
    setEditingValue,
    commitEdit,
    cancelEdit,
    inputProps,
  }
}
