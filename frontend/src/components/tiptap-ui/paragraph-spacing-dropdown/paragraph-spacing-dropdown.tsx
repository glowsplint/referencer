import { forwardRef, useCallback, useState } from "react";

import { ChevronDownIcon } from "@/components/tiptap-icons/chevron-down-icon";
import { ParagraphSpacingIcon } from "@/components/tiptap-icons/paragraph-spacing-icon";

import { useParagraphSpacing, PARAGRAPH_SPACING_OPTIONS } from "./use-paragraph-spacing";

import type { ButtonProps } from "@/components/tiptap-ui-primitive/button";
import { Button, ButtonGroup } from "@/components/tiptap-ui-primitive/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/tiptap-ui-primitive/dropdown-menu";
import { Card, CardBody } from "@/components/tiptap-ui-primitive/card";

export interface ParagraphSpacingDropdownProps extends Omit<ButtonProps, "type"> {
  portal?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export const ParagraphSpacingDropdown = forwardRef<
  HTMLButtonElement,
  ParagraphSpacingDropdownProps
>(({ portal = false, onOpenChange, ...buttonProps }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const { paragraphSpacing, setParagraphSpacing } = useParagraphSpacing();

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
          aria-label="Paragraph spacing"
          tooltip="Paragraph spacing"
          {...buttonProps}
          ref={ref}
        >
          <ParagraphSpacingIcon className="tiptap-button-icon" />
          <ChevronDownIcon className="tiptap-button-dropdown-small" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" portal={portal}>
        <Card>
          <CardBody>
            <ButtonGroup>
              {PARAGRAPH_SPACING_OPTIONS.map((option) => {
                const isActive = paragraphSpacing === option.value;
                return (
                  <DropdownMenuItem key={option.value} asChild>
                    <Button
                      type="button"
                      data-style="ghost"
                      data-active-state={isActive ? "on" : "off"}
                      role="menuitemradio"
                      aria-checked={isActive}
                      onClick={() => {
                        setParagraphSpacing(option.value);
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
});

ParagraphSpacingDropdown.displayName = "ParagraphSpacingDropdown";

export default ParagraphSpacingDropdown;
