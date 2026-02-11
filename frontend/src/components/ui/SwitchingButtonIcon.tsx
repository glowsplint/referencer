import type { ReactNode } from "react";
import type { ButtonProps } from "../../types";

interface SwitchingButtonIconProps {
  iconOne: ReactNode;
  iconTwo: ReactNode;
  bool: boolean;
  callback: () => void;
  title?: string;
  buttonProps?: ButtonProps;
}

export function SwitchingButtonIcon({
  iconOne,
  iconTwo,
  bool,
  callback,
  title,
  buttonProps,
}: SwitchingButtonIconProps) {
  return (
    <button
      onClick={callback}
      title={title}
      className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
      {...buttonProps}
    >
      {bool ? iconTwo : iconOne}
    </button>
  );
}
