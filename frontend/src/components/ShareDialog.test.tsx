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
  let writeText: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.restoreAllMocks()
    writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
  })

  it("renders dialog with title and buttons", () => {
    renderShareDialog()
    expect(screen.getByText("Share workspace")).toBeInTheDocument()
    expect(screen.getByTestId("shareReadonlyButton")).toBeInTheDocument()
    expect(screen.getByTestId("shareEditButton")).toBeInTheDocument()
  })

  it("copies read-only hash URL when read-only button clicked", async () => {
    renderShareDialog()
    fireEvent.click(screen.getByTestId("shareReadonlyButton"))

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        expect.stringContaining("#/test-workspace-123?access=readonly")
      )
    })
  })

  it("copies edit hash URL when edit button clicked", async () => {
    renderShareDialog()
    fireEvent.click(screen.getByTestId("shareEditButton"))

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        expect.stringContaining("#/test-workspace-123")
      )
      expect(writeText).toHaveBeenCalledWith(
        expect.not.stringContaining("access=readonly")
      )
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
