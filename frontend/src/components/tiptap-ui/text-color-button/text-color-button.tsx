import { forwardRef, useCallback, useMemo, useRef, useState } from "react";
import { type Editor } from "@tiptap/react";

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/ui/use-tiptap-editor";
import { useMenuNavigation } from "@/hooks/ui/use-menu-navigation";
import { useIsBreakpoint } from "@/hooks/ui/use-is-breakpoint";

// --- Icons ---
import { BanIcon } from "@/components/tiptap-icons/ban-icon";

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button";
import { Button, ButtonGroup } from "@/components/tiptap-ui-primitive/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/tiptap-ui-primitive/popover";
import { Separator } from "@/components/tiptap-ui-primitive/separator";
import { Card, CardBody, CardItemGroup } from "@/components/tiptap-ui-primitive/card";

// --- Tiptap UI ---
import type { TextColor, UseTextColorConfig } from "./use-text-color";
import { useTextColor, pickTextColorsByValue } from "./use-text-color";

export interface TextColorButtonProps extends Omit<ButtonProps, "type"> {
  editor?: Editor | null;
  color: string;
  label?: string;
}

export const TextColorButton = forwardRef<HTMLButtonElement, TextColorButtonProps>(
  ({ editor: providedEditor, color, label, onClick, style, children, ...buttonProps }, ref) => {
    const { editor } = useTiptapEditor(providedEditor);
    const { canSetTextColor, isActive, setTextColor } = useTextColor({ editor, color });

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        setTextColor(color);
      },
      [setTextColor, color, onClick],
    );

    const buttonStyle = useMemo(
      () =>
        ({
          ...style,
          "--text-color-value": color || "currentColor",
        }) as React.CSSProperties,
      [color, style],
    );

    return (
      <Button
        type="button"
        data-style="ghost"
        data-active-state={isActive ? "on" : "off"}
        role="button"
        tabIndex={-1}
        disabled={!canSetTextColor}
        data-disabled={!canSetTextColor}
        aria-label={label || `Text color: ${color}`}
        aria-pressed={isActive}
        tooltip={label || `Text color: ${color}`}
        onClick={handleClick}
        style={buttonStyle}
        {...buttonProps}
        ref={ref}
      >
        {children ?? (
          <span className="flex flex-col items-center leading-none">
            <span
              className="text-sm font-bold"
              style={{ color: color || "currentColor" }}
            >
              A
            </span>
            <span
              className="w-3.5 h-0.5 rounded-full -mt-0.5"
              style={{ backgroundColor: color || "currentColor" }}
            />
          </span>
        )}
      </Button>
    );
  },
);

TextColorButton.displayName = "TextColorButton";

// --- Popover ---

export interface TextColorPopoverContentProps {
  editor?: Editor | null;
  colors?: TextColor[];
}

export interface TextColorPopoverProps
  extends Omit<ButtonProps, "type">,
    Pick<UseTextColorConfig, "editor" | "hideWhenUnavailable"> {
  colors?: TextColor[];
}

export function TextColorPopoverContent({
  editor,
  colors = pickTextColorsByValue([
    "#6b7280",
    "#dc2626",
    "#ea580c",
    "#ca8a04",
    "#16a34a",
    "#2563eb",
    "#9333ea",
    "#db2777",
  ]),
}: TextColorPopoverContentProps) {
  const { unsetTextColor } = useTextColor({ editor });
  const isMobile = useIsBreakpoint();
  const containerRef = useRef<HTMLDivElement>(null);

  const menuItems = useMemo(
    () => [...colors, { label: "Remove color", value: "none" }],
    [colors],
  );

  const { selectedIndex } = useMenuNavigation({
    containerRef,
    items: menuItems,
    orientation: "both",
    onSelect: (item) => {
      if (!containerRef.current) return false;
      const highlightedElement = containerRef.current.querySelector(
        '[data-highlighted="true"]',
      ) as HTMLElement;
      if (highlightedElement) highlightedElement.click();
      if (item.value === "none") unsetTextColor();
      return true;
    },
    autoSelectFirstItem: false,
  });

  return (
    <Card ref={containerRef} tabIndex={0} style={isMobile ? { boxShadow: "none", border: 0 } : {}}>
      <CardBody style={isMobile ? { padding: 0 } : {}}>
        <CardItemGroup orientation="horizontal">
          <ButtonGroup orientation="horizontal">
            {colors.map((color, index) => (
              <TextColorButton
                key={color.value}
                editor={editor}
                color={color.value}
                label={color.label}
                tooltip={color.label}
                aria-label={`${color.label} text color`}
                tabIndex={index === selectedIndex ? 0 : -1}
                data-highlighted={selectedIndex === index}
              />
            ))}
          </ButtonGroup>
          <Separator />
          <ButtonGroup orientation="horizontal">
            <Button
              onClick={unsetTextColor}
              aria-label="Remove text color"
              tooltip="Remove text color"
              tabIndex={selectedIndex === colors.length ? 0 : -1}
              type="button"
              role="menuitem"
              data-style="ghost"
              data-highlighted={selectedIndex === colors.length}
            >
              <BanIcon className="tiptap-button-icon" />
            </Button>
          </ButtonGroup>
        </CardItemGroup>
      </CardBody>
    </Card>
  );
}

export function TextColorPopover({
  editor: providedEditor,
  colors = pickTextColorsByValue([
    "#6b7280",
    "#dc2626",
    "#ea580c",
    "#ca8a04",
    "#16a34a",
    "#2563eb",
    "#9333ea",
    "#db2777",
  ]),
  hideWhenUnavailable = false,
  ...props
}: TextColorPopoverProps) {
  const { editor } = useTiptapEditor(providedEditor);
  const [isOpen, setIsOpen] = useState(false);
  const { isVisible, canSetTextColor, currentColor } = useTextColor({
    editor,
    hideWhenUnavailable,
  });

  if (!isVisible) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          data-style="ghost"
          data-appearance="default"
          role="button"
          tabIndex={-1}
          disabled={!canSetTextColor}
          data-disabled={!canSetTextColor}
          aria-label="Text color"
          tooltip="Text color"
          {...props}
        >
          <span className="flex flex-col items-center leading-none">
            <span
              className="text-sm font-bold"
              style={{ color: currentColor || "currentColor" }}
            >
              A
            </span>
            <span
              className="w-3.5 h-0.5 rounded-full -mt-0.5"
              style={{ backgroundColor: currentColor || "currentColor" }}
            />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent aria-label="Text colors">
        <TextColorPopoverContent editor={editor} colors={colors} />
      </PopoverContent>
    </Popover>
  );
}

export default TextColorPopover;
