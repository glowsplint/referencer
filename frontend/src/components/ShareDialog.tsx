// Dialog for sharing the workspace via URL. Generates either a read-only or
// edit link using hash-based routing (e.g., #/<workspaceId>?access=readonly)
// and copies it to the clipboard.
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

const BASE_URL = import.meta.env.BASE_URL

export function ShareDialog({
  open,
  onOpenChange,
  workspaceId,
}: ShareDialogProps) {
  async function copyLink(access: "edit" | "readonly") {
    const hash =
      access === "readonly"
        ? `#/${workspaceId}?access=readonly`
        : `#/${workspaceId}`
    const url = `${window.location.origin}${BASE_URL}${hash}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Link copied to clipboard")
      onOpenChange(false)
    } catch {
      toast.error("Failed to copy link")
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
            Copy a link to share this workspace.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={() => copyLink("readonly")}
            data-testid="shareReadonlyButton"
          >
            <Eye />
            Read-only link
          </Button>
          <Button
            variant="outline"
            onClick={() => copyLink("edit")}
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
