import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useStatusMessage } from "./use-status-message"

describe("useStatusMessage", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("starts with null message", () => {
    const { result } = renderHook(() => useStatusMessage())
    expect(result.current.message).toBeNull()
  })

  it("setStatus sets message", () => {
    const { result } = renderHook(() => useStatusMessage())

    act(() => {
      result.current.setStatus({ text: "Hello", type: "info" })
    })

    expect(result.current.message).toEqual({ text: "Hello", type: "info" })
  })

  it("clearStatus clears message", () => {
    const { result } = renderHook(() => useStatusMessage())

    act(() => {
      result.current.setStatus({ text: "Hello", type: "info" })
    })
    act(() => {
      result.current.clearStatus()
    })

    expect(result.current.message).toBeNull()
  })

  it("auto-clears message after duration", () => {
    const { result } = renderHook(() => useStatusMessage())

    act(() => {
      result.current.setStatus({ text: "Temporary", type: "success" }, 1500)
    })

    expect(result.current.message).not.toBeNull()

    act(() => {
      vi.advanceTimersByTime(1500)
    })

    expect(result.current.message).toBeNull()
  })

  it("cancels previous timer when setting new message", () => {
    const { result } = renderHook(() => useStatusMessage())

    act(() => {
      result.current.setStatus({ text: "First", type: "info" }, 1000)
    })
    act(() => {
      result.current.setStatus({ text: "Second", type: "info" })
    })

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // Should still show "Second" since the first timer was cancelled
    expect(result.current.message).toEqual({ text: "Second", type: "info" })
  })

  it("clearStatus cancels pending timer", () => {
    const { result } = renderHook(() => useStatusMessage())

    act(() => {
      result.current.setStatus({ text: "Temp", type: "success" }, 2000)
    })
    act(() => {
      result.current.clearStatus()
    })

    expect(result.current.message).toBeNull()

    // Timer should not re-clear anything
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.message).toBeNull()
  })
})
