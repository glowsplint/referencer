// Simple icon button wrapper used in the management panel and toolbar.
// Renders an icon inside a styled button with hover and disabled states.
import type { ReactNode } from "react";
import type { ButtonProps } from "../../types";

interface ButtonIconProps {
  icon: ReactNode;
  callback: () => void;
  title?: string;
  disabled?: boolean;
  buttonProps?: ButtonProps;
}

export function ButtonIcon({ icon, callback, title, disabled, buttonProps }: ButtonIconProps) {
  return (
    <button
      onClick={callback}
      title={title}
      disabled={disabled}
      className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:pointer-events-none"
      {...buttonProps}
    >
      {icon}
    </button>
  );
}
