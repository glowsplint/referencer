import * as Popover from "@radix-ui/react-popover";
import { LogIn } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/tiptap-ui-primitive/tooltip/tooltip";
import { useAuth } from "@/hooks/data/use-auth";
import type { AuthProvider } from "@/lib/auth-client";

const providers: { id: AuthProvider; label: string }[] = [
  { id: "google", label: "Sign in with Google" },
  { id: "apple", label: "Sign in with Apple" },
  { id: "facebook", label: "Sign in with Facebook" },
];

export function LoginButton() {
  const { login } = useAuth();

  return (
    <Popover.Root>
      <Tooltip placement="bottom">
        <TooltipTrigger asChild>
          <Popover.Trigger asChild>
            <button
              className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              data-testid="loginButton"
            >
              <LogIn size={20} />
            </button>
          </Popover.Trigger>
        </TooltipTrigger>
        <TooltipContent>Sign in</TooltipContent>
      </Tooltip>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          sideOffset={8}
          className="z-50 rounded-lg border border-border bg-popover p-2 shadow-md"
          data-testid="loginPopover"
        >
          <div className="flex flex-col gap-1">
            {providers.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => login(id)}
                className="px-3 py-2 text-sm rounded-md text-left hover:bg-accent hover:text-accent-foreground transition-colors whitespace-nowrap"
                data-testid={`login-${id}`}
              >
                {label}
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
