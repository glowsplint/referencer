import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Tag } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TagInput } from "./TagInput";

interface TagMenuProps {
  documentId: string;
  currentTags: string[];
  allTags: string[];
  onAddTag: (documentId: string, tag: string) => void;
  onRemoveTag: (documentId: string, tag: string) => void;
}

export function TagMenu({ documentId, currentTags, allTags, onAddTag, onRemoveTag }: TagMenuProps) {
  const { t } = useTranslation("management");

  return (
    <DropdownMenu.Sub>
      <DropdownMenu.SubTrigger className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors data-[state=open]:bg-accent">
        <Tag size={14} /> {t("hub.tags")}
      </DropdownMenu.SubTrigger>
      <DropdownMenu.Portal>
        <DropdownMenu.SubContent
          sideOffset={4}
          className="z-50 min-w-[200px] max-h-[300px] overflow-y-auto rounded-lg border border-border bg-popover p-2 shadow-md"
        >
          <TagInput
            documentId={documentId}
            currentTags={currentTags}
            allTags={allTags}
            onAddTag={onAddTag}
            onRemoveTag={onRemoveTag}
          />
        </DropdownMenu.SubContent>
      </DropdownMenu.Portal>
    </DropdownMenu.Sub>
  );
}
