import { useState, useCallback } from "react";
import { Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MiniCommentEditor } from "@/components/MiniCommentEditor";

interface ReplyInputProps {
  onSubmit: (text: string) => void;
  placeholder?: string;
}

/** Collapsed "Reply..." placeholder that expands to a MiniCommentEditor + send button. */
export function ReplyInput({ onSubmit, placeholder }: ReplyInputProps) {
  const { t } = useTranslation("management");
  const [active, setActive] = useState(false);
  const [value, setValue] = useState("");

  const resolvedPlaceholder = placeholder ?? t("annotations.replyPlaceholder");

  const handleSubmit = useCallback(() => {
    const trimmed = value.replace(/<[^>]*>/g, "").trim();
    if (trimmed.length > 0) {
      onSubmit(value);
      setValue("");
      setActive(false);
    }
  }, [value, onSubmit]);

  if (!active) {
    return (
      <div
        className="px-2 py-1 text-xs text-zinc-400 italic cursor-pointer hover:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setActive(true);
        }}
      >
        {resolvedPlaceholder}
      </div>
    );
  }

  return (
    <div className="flex items-end gap-1 px-1 pb-1" onClick={(e) => e.stopPropagation()}>
      <div className="flex-1 min-w-0">
        <MiniCommentEditor
          value={value}
          onChange={setValue}
          onBlur={() => {
            // Close if empty on blur
            const trimmed = value.replace(/<[^>]*>/g, "").trim();
            if (trimmed.length === 0) {
              setActive(false);
            }
          }}
          placeholder={resolvedPlaceholder}
          autoFocus
        />
      </div>
      <button
        className="flex-shrink-0 p-1 rounded text-zinc-400 hover:text-blue-500 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          handleSubmit();
        }}
        title="Send reply"
      >
        <Send size={12} />
      </button>
    </div>
  );
}
