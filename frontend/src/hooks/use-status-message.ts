// Two-layer status message system: a persistent "base" message (set by the active
// tool's current phase) and a transient "flash" message that temporarily overrides
// the base and auto-reverts. This ensures the status bar always reflects the
// current tool state, even after transient success toasts expire.
import { useState, useCallback, useRef, type ReactNode } from "react"

export interface StatusMessage {
  text: ReactNode
  type: "info" | "success"
}

export function useStatusMessage() {
  const [baseMessage, setBaseMessage] = useState<StatusMessage | null>(null)
  const [flashMsg, setFlashMsg] = useState<StatusMessage | null>(null)
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearStatus = useCallback(() => {
    if (flashTimerRef.current) {
      clearTimeout(flashTimerRef.current)
      flashTimerRef.current = null
    }
    setBaseMessage(null)
    setFlashMsg(null)
  }, [])

  // Set the persistent base message (no auto-dismiss).
  const setStatus = useCallback((msg: StatusMessage) => {
    setBaseMessage(msg)
  }, [])

  // Show a transient message that auto-reverts to the base after `duration` ms.
  const flashStatus = useCallback((msg: StatusMessage, duration: number) => {
    if (flashTimerRef.current) {
      clearTimeout(flashTimerRef.current)
    }
    setFlashMsg(msg)
    flashTimerRef.current = setTimeout(() => {
      setFlashMsg(null)
      flashTimerRef.current = null
    }, duration)
  }, [])

  const message = flashMsg ?? baseMessage

  return { message, setStatus, flashStatus, clearStatus }
}
