import { useState, useRef, useEffect } from "react";

interface InlineNameInputProps {
  defaultValue?: string;
  onSave: (value: string) => void;
  onCancel: () => void;
  placeholder?: string;
  className?: string;
}

export function InlineNameInput({
  defaultValue = "",
  onSave,
  onCancel,
  placeholder = "Folder name",
  className = "",
}: InlineNameInputProps) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSave = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onSave(trimmed);
    } else {
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleSave();
        if (e.key === "Escape") onCancel();
      }}
      onBlur={handleSave}
      placeholder={placeholder}
      className={`bg-transparent border border-border rounded px-2 py-1 text-sm outline-none focus:border-primary ${className}`}
      data-testid="inlineNameInput"
    />
  );
}
