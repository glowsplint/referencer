// Shared component prop types used across UI wrapper components.
import type { ButtonHTMLAttributes } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  Record<`data-${string}`, string>;
