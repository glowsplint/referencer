import { screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { ShareDialog } from "./ShareDialog"
import { renderWithWorkspace } from "@/test/render-with-workspace"

function renderShareDialog(overrides = {}) {
  return renderWithWorkspace(
    <ShareDialog
      open={true}
      onOpenChange={vi.fn()}
      workspaceId="test-workspace-123"
    />,
    overrides
  )
}

describe("ShareDialog", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("renders dialog with title and buttons", () => {
    renderShareDialog()
    expect(screen.getByText("Share workspace")).toBeInTheDocument()
    expect(screen.getByTestId("shareReadonlyButton")).toBeInTheDocument()
    expect(screen.getByTestId("shareEditButton")).toBeInTheDocument()
  })

  it("calls API with readonly access when read-only button clicked", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ code: "abc123", url: "/s/abc123" }),
    } as Response)

    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    renderShareDialog()
    fireEvent.click(screen.getByTestId("shareReadonlyButton"))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: "test-workspace-123", access: "readonly" }),
      })
    })
  })

  it("calls API with edit access when edit button clicked", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ code: "xyz789", url: "/s/xyz789" }),
    } as Response)

    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    renderShareDialog()
    fireEvent.click(screen.getByTestId("shareEditButton"))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: "test-workspace-123", access: "edit" }),
      })
    })
  })

  it("copies URL to clipboard after successful API call", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ code: "abc123", url: "/s/abc123" }),
    } as Response)

    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    renderShareDialog()
    fireEvent.click(screen.getByTestId("shareReadonlyButton"))

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        expect.stringContaining("/s/abc123")
      )
    })
  })

  it("shows error toast when API returns non-ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
    } as Response)

    const writeText = vi.fn()
    Object.assign(navigator, { clipboard: { writeText } })

    renderShareDialog()
    fireEvent.click(screen.getByTestId("shareReadonlyButton"))

    await waitFor(() => {
      expect(writeText).not.toHaveBeenCalled()
    })
  })

  it("does not render when open is false", () => {
    renderWithWorkspace(
      <ShareDialog
        open={false}
        onOpenChange={vi.fn()}
        workspaceId="test-workspace-123"
      />
    )
    expect(screen.queryByText("Share workspace")).not.toBeInTheDocument()
  })
})
