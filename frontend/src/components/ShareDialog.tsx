import { useState } from "react"
import { Link, Eye } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
}

export function ShareDialog({
  open,
  onOpenChange,
  workspaceId,
}: ShareDialogProps) {
  const [loading, setLoading] = useState<"edit" | "readonly" | null>(null)

  async function createLink(access: "edit" | "readonly") {
    setLoading(access)
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, access }),
      })
      if (!res.ok) {
        toast.error("Failed to create share link")
        return
      }
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
        return
      }
      const fullUrl = `${window.location.origin}${data.url}`
      await navigator.clipboard.writeText(fullUrl)
      toast.success("Link copied to clipboard")
      onOpenChange(false)
    } catch {
      toast.error("Failed to create share link")
    } finally {
      setLoading(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-sm"
        data-testid="shareDialog"
      >
        <DialogHeader>
          <DialogTitle>Share workspace</DialogTitle>
          <DialogDescription>
            Generate a short link to share this workspace.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={() => createLink("readonly")}
            disabled={loading !== null}
            data-testid="shareReadonlyButton"
          >
            <Eye />
            Read-only link
          </Button>
          <Button
            variant="outline"
            onClick={() => createLink("edit")}
            disabled={loading !== null}
            data-testid="shareEditButton"
          >
            <Link />
            Edit link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
