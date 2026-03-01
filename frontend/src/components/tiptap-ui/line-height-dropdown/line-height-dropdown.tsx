import { forwardRef, useCallback, useState } from "react";

import { ChevronDownIcon } from "@/components/tiptap-icons/chevron-down-icon";
import { LineHeightIcon } from "@/components/tiptap-icons/line-height-icon";

import { useLineHeight, LINE_HEIGHT_OPTIONS } from "./use-line-height";

import type { ButtonProps } from "@/components/tiptap-ui-primitive/button";
import { Button, ButtonGroup } from "@/components/tiptap-ui-primitive/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/tiptap-ui-primitive/dropdown-menu";
import { Card, CardBody } from "@/components/tiptap-ui-primitive/card";

export interface LineHeightDropdownProps extends Omit<ButtonProps, "type"> {
  portal?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export const LineHeightDropdown = forwardRef<HTMLButtonElement, LineHeightDropdownProps>(
  ({ portal = false, onOpenChange, ...buttonProps }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const { lineHeight, setLineHeight } = useLineHeight();

    const handleOpenChange = useCallback(
      (open: boolean) => {
        setIsOpen(open);
        onOpenChange?.(open);
      },
      [onOpenChange],
    );

    return (
      <DropdownMenu modal open={isOpen} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            data-style="ghost"
            role="button"
            tabIndex={-1}
            aria-label="Line height"
            tooltip="Line height"
            {...buttonProps}
            ref={ref}
          >
            <LineHeightIcon className="tiptap-button-icon" />
            <ChevronDownIcon className="tiptap-button-dropdown-small" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" portal={portal}>
          <Card>
            <CardBody>
              <ButtonGroup>
                {LINE_HEIGHT_OPTIONS.map((option) => {
                  const isActive = lineHeight === option.value;
                  return (
                    <DropdownMenuItem key={option.value} asChild>
                      <Button
                        type="button"
                        data-style="ghost"
                        data-active-state={isActive ? "on" : "off"}
                        role="menuitemradio"
                        aria-checked={isActive}
                        onClick={() => {
                          setLineHeight(option.value);
                          handleOpenChange(false);
                        }}
                      >
                        {option.label}
                      </Button>
                    </DropdownMenuItem>
                  );
                })}
              </ButtonGroup>
            </CardBody>
          </Card>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
);

LineHeightDropdown.displayName = "LineHeightDropdown";

export default LineHeightDropdown;
