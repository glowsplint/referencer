import { Check } from "lucide-react";

interface SelectionCheckboxProps {
  checked: boolean;
  visible: boolean;
  onClick: (e: React.MouseEvent) => void;
}

export function SelectionCheckbox({ checked, visible, onClick }: SelectionCheckboxProps) {
  return (
    <button
      tabIndex={-1}
      onClick={onClick}
      data-testid="selectionCheckbox"
      className={`flex items-center justify-center w-4 h-4 rounded border shrink-0 transition-all duration-150 ${
        visible ? "opacity-100 scale-100 mr-1.5" : "opacity-0 scale-75 w-0 mr-0 overflow-hidden"
      } ${
        checked
          ? "bg-primary border-primary text-primary-foreground"
          : "border-muted-foreground/40 hover:border-primary"
      }`}
    >
      {checked && <Check size={12} strokeWidth={3} />}
    </button>
  );
}
