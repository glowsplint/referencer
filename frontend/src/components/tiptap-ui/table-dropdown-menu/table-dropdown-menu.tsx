import { useCallback, useState } from "react";
import { type Editor } from "@tiptap/react";
import { useTranslation } from "react-i18next";

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/ui/use-tiptap-editor";

// --- Icons ---
import { ChevronDownIcon } from "@/components/tiptap-icons/chevron-down-icon";
import { TableIcon } from "@/components/tiptap-icons/table-icon";
import { TableAddColumnIcon } from "@/components/tiptap-icons/table-add-column-icon";
import { TableAddRowIcon } from "@/components/tiptap-icons/table-add-row-icon";
import { TableDeleteColumnIcon } from "@/components/tiptap-icons/table-delete-column-icon";
import { TableDeleteRowIcon } from "@/components/tiptap-icons/table-delete-row-icon";
import { TableDeleteIcon } from "@/components/tiptap-icons/table-delete-icon";
import { TableMergeCellsIcon } from "@/components/tiptap-icons/table-merge-cells-icon";
import { TableSplitCellIcon } from "@/components/tiptap-icons/table-split-cell-icon";
import { TableHeaderIcon } from "@/components/tiptap-icons/table-header-icon";

// --- Hook ---
import { useTableDropdownMenu } from "./use-table-dropdown-menu";

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button";
import { Button, ButtonGroup } from "@/components/tiptap-ui-primitive/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/tiptap-ui-primitive/dropdown-menu";
import { Card, CardBody } from "@/components/tiptap-ui-primitive/card";

export interface TableDropdownMenuProps extends Omit<ButtonProps, "type"> {
  editor?: Editor;
  onOpenChange?: (isOpen: boolean) => void;
  portal?: boolean;
}

export function TableDropdownMenu({
  editor: providedEditor,
  onOpenChange,
  portal = false,
  ...props
}: TableDropdownMenuProps) {
  const { t } = useTranslation("editor");
  const { editor } = useTiptapEditor(providedEditor);
  const [isOpen, setIsOpen] = useState(false);

  const {
    isVisible,
    isInTable,
    insertTable,
    addRowBefore,
    addRowAfter,
    deleteRow,
    addColumnBefore,
    addColumnAfter,
    deleteColumn,
    mergeCells,
    splitCell,
    toggleHeaderRow,
    toggleHeaderColumn,
    deleteTable,
  } = useTableDropdownMenu({ editor });

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      onOpenChange?.(open);
    },
    [onOpenChange],
  );

  const runAction = useCallback(
    (action: () => void) => {
      action();
      handleOpenChange(false);
    },
    [handleOpenChange],
  );

  if (!isVisible) {
    return null;
  }

  // When not in a table, render a simple button that inserts a table directly
  if (!isInTable) {
    return (
      <Button
        type="button"
        data-style="ghost"
        data-active-state="off"
        role="button"
        tabIndex={-1}
        aria-label={t("table.label")}
        tooltip={t("table.label")}
        onClick={insertTable}
        {...props}
      >
        <TableIcon className="tiptap-button-icon" />
      </Button>
    );
  }

  // When inside a table, show dropdown with table operations
  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          data-style="ghost"
          data-active-state="on"
          role="button"
          tabIndex={-1}
          aria-label={t("table.label")}
          tooltip={t("table.label")}
          {...props}
        >
          <TableIcon className="tiptap-button-icon" />
          <ChevronDownIcon className="tiptap-button-dropdown-small" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" portal={portal}>
        <Card>
          <CardBody>
            <ButtonGroup orientation="vertical">
              {/* Row actions */}
              <DropdownMenuItem asChild>
                <Button type="button" data-style="ghost" onClick={() => runAction(addRowBefore)}>
                  <TableAddRowIcon className="tiptap-button-icon" />
                  <span>{t("table.addRowBefore")}</span>
                </Button>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Button type="button" data-style="ghost" onClick={() => runAction(addRowAfter)}>
                  <TableAddRowIcon className="tiptap-button-icon" />
                  <span>{t("table.addRowAfter")}</span>
                </Button>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Button type="button" data-style="ghost" onClick={() => runAction(deleteRow)}>
                  <TableDeleteRowIcon className="tiptap-button-icon" />
                  <span>{t("table.deleteRow")}</span>
                </Button>
              </DropdownMenuItem>

              {/* Column actions */}
              <DropdownMenuItem asChild>
                <Button type="button" data-style="ghost" onClick={() => runAction(addColumnBefore)}>
                  <TableAddColumnIcon className="tiptap-button-icon" />
                  <span>{t("table.addColumnBefore")}</span>
                </Button>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Button type="button" data-style="ghost" onClick={() => runAction(addColumnAfter)}>
                  <TableAddColumnIcon className="tiptap-button-icon" />
                  <span>{t("table.addColumnAfter")}</span>
                </Button>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Button type="button" data-style="ghost" onClick={() => runAction(deleteColumn)}>
                  <TableDeleteColumnIcon className="tiptap-button-icon" />
                  <span>{t("table.deleteColumn")}</span>
                </Button>
              </DropdownMenuItem>

              {/* Cell actions */}
              <DropdownMenuItem asChild>
                <Button type="button" data-style="ghost" onClick={() => runAction(mergeCells)}>
                  <TableMergeCellsIcon className="tiptap-button-icon" />
                  <span>{t("table.mergeCells")}</span>
                </Button>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Button type="button" data-style="ghost" onClick={() => runAction(splitCell)}>
                  <TableSplitCellIcon className="tiptap-button-icon" />
                  <span>{t("table.splitCell")}</span>
                </Button>
              </DropdownMenuItem>

              {/* Header toggles */}
              <DropdownMenuItem asChild>
                <Button type="button" data-style="ghost" onClick={() => runAction(toggleHeaderRow)}>
                  <TableHeaderIcon className="tiptap-button-icon" />
                  <span>{t("table.toggleHeaderRow")}</span>
                </Button>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Button
                  type="button"
                  data-style="ghost"
                  onClick={() => runAction(toggleHeaderColumn)}
                >
                  <TableHeaderIcon className="tiptap-button-icon" />
                  <span>{t("table.toggleHeaderColumn")}</span>
                </Button>
              </DropdownMenuItem>

              {/* Delete table */}
              <DropdownMenuItem asChild>
                <Button type="button" data-style="ghost" onClick={() => runAction(deleteTable)}>
                  <TableDeleteIcon className="tiptap-button-icon" />
                  <span>{t("table.deleteTable")}</span>
                </Button>
              </DropdownMenuItem>
            </ButtonGroup>
          </CardBody>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default TableDropdownMenu;
