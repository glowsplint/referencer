import { useRef } from "react";
import { useInlineEdit } from "@/hooks/ui/use-inline-edit";
import { FileUp } from "lucide-react";

interface TextHeaderProps {
  name: string;
  index: number;
  onUpdateName: (name: string) => void;
  onUploadPdf?: (file: File) => void;
}

export function TextHeader({ name, index, onUpdateName, onUploadPdf }: TextHeaderProps) {
  const { isEditing, inputProps, startEditing } = useInlineEdit({
    currentName: name,
    onCommit: onUpdateName,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center px-3 py-1 border-b border-border bg-muted/30 shrink-0">
      {isEditing ? (
        <input
          {...inputProps}
          className="text-sm font-medium bg-transparent border-0 ring-1 ring-border rounded px-1 py-0 outline-none w-full"
          data-testid={`textHeaderInput-${index}`}
        />
      ) : (
        <span
          className="text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:underline decoration-muted-foreground/30 cursor-text rounded px-1 flex-1"
          onDoubleClick={() => startEditing()}
          data-testid={`textHeader-${index}`}
        >
          {name}
        </span>
      )}
      {onUploadPdf && (
        <>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="ml-1 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50"
            data-testid={`pdfUpload-${index}`}
            title="Upload PDF"
          >
            <FileUp size={14} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadPdf(file);
              e.target.value = "";
            }}
          />
        </>
      )}
    </div>
  );
}
