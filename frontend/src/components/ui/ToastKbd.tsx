// Inline keyboard shortcut badge for use inside toast/status messages.
// Renders a styled <kbd> element with monospace font.
export function ToastKbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center rounded border bg-muted/50 px-1 py-0.5 text-[11px] font-mono font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}
