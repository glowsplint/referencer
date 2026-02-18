// Icon button that toggles between two icons based on a boolean state.
// Used for toolbar toggles like dark mode, layout direction, and lock.
import { forwardRef, type ReactNode } from "react";
import type { ButtonProps } from "../../types";

interface SwitchingButtonIconProps {
  iconOne: ReactNode;
  iconTwo: ReactNode;
  bool: boolean;
  callback: () => void;
  title?: string;
  buttonProps?: ButtonProps;
}

export const SwitchingButtonIcon = forwardRef<HTMLButtonElement, SwitchingButtonIconProps>(
  function SwitchingButtonIcon(
    { iconOne, iconTwo, bool, callback, title, buttonProps, ...rest },
    ref
  ) {
    return (
      <button
        ref={ref}
        onClick={callback}
        title={title}
        className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
        {...buttonProps}
        {...rest}
      >
        {bool ? iconTwo : iconOne}
      </button>
    );
  }
);
