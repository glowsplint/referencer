// Tailwind CSS class merging utility. Combines clsx conditional classes
// with tailwind-merge to resolve conflicting utility classes.
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
