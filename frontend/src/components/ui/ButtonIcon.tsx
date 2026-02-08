import type { ReactNode } from "react";
import type { ButtonProps } from "../../types";

interface ButtonIconProps {
  icon: ReactNode;
  callback: () => void;
  title?: string;
  buttonProps?: ButtonProps;
}

export function ButtonIcon({ icon, callback, title, buttonProps }: ButtonIconProps) {
  return (
    <button
      onClick={callback}
      title={title}
      className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
      {...buttonProps}
    >
      {icon}
    </button>
  );
}
