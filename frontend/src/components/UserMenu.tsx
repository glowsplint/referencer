import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { LogOut } from "lucide-react"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/tiptap-ui-primitive/tooltip/tooltip"
import { useAuth } from "@/hooks/use-auth"

export function UserMenu() {
  const { user, logout } = useAuth()

  if (!user) return null

  const initial = user.name?.charAt(0).toUpperCase() ?? "?"

  return (
    <DropdownMenu.Root>
      <Tooltip placement="right">
        <TooltipTrigger asChild>
          <DropdownMenu.Trigger asChild>
            <button
              className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              data-testid="userMenuButton"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                {initial}
              </div>
            </button>
          </DropdownMenu.Trigger>
        </TooltipTrigger>
        <TooltipContent>{user.name}</TooltipContent>
      </Tooltip>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="right"
          sideOffset={8}
          className="z-50 min-w-[180px] rounded-lg border border-border bg-popover p-1 shadow-md"
          data-testid="userMenuDropdown"
        >
          <div className="px-3 py-2">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item
            onSelect={() => logout()}
            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
            data-testid="signOutButton"
          >
            <LogOut size={16} />
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
