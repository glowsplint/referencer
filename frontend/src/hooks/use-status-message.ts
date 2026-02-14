import { useState, useCallback, useRef, type ReactNode } from "react"

export interface StatusMessage {
  text: ReactNode
  type: "info" | "success"
}

export function useStatusMessage() {
  const [message, setMessage] = useState<StatusMessage | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearStatus = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setMessage(null)
  }, [])

  const setStatus = useCallback(
    (msg: StatusMessage, duration?: number) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      setMessage(msg)
      if (duration) {
        timerRef.current = setTimeout(() => {
          setMessage(null)
          timerRef.current = null
        }, duration)
      }
    },
    []
  )

  return { message, setStatus, clearStatus }
}
