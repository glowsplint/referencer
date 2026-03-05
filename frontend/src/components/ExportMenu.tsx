import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/tiptap-ui-primitive/tooltip";

interface ExportMenuProps {
  onExportMarkdown: () => void;
}

export function ExportMenu({ onExportMarkdown }: ExportMenuProps) {
  const { t } = useTranslation();

  return (
    <DropdownMenu.Root>
      <Tooltip placement="bottom" delay={300}>
        <TooltipTrigger asChild>
          <DropdownMenu.Trigger asChild>
            <button
              className="rounded-md p-1.5 transition-colors hover:bg-accent hover:text-accent-foreground"
              data-testid="exportMenuButton"
            >
              <Download size={16} />
            </button>
          </DropdownMenu.Trigger>
        </TooltipTrigger>
        <TooltipContent>{t("export.title")}</TooltipContent>
      </Tooltip>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={4}
          className="z-50 min-w-[160px] rounded-lg border border-border bg-popover p-1 shadow-md"
          data-testid="exportMenu"
        >
          <DropdownMenu.Item
            onSelect={() => window.print()}
            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
            data-testid="exportPdfButton"
          >
            {t("export.pdf")}
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={onExportMarkdown}
            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
            data-testid="exportMarkdownButton"
          >
            {t("export.markdown")}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
