import { useInlineEdit } from "@/hooks/ui/use-inline-edit";

interface TextHeaderProps {
  name: string;
  index: number;
  onUpdateName: (name: string) => void;
}

export function TextHeader({ name, index, onUpdateName }: TextHeaderProps) {
  const { isEditing, inputProps, startEditing } = useInlineEdit({
    currentName: name,
    onCommit: onUpdateName,
  });

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
    </div>
  );
}
