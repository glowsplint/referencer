import { useTranslation } from "react-i18next";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Plus } from "lucide-react";
import { STUDY_SCHEMES } from "@/constants/study-schemes";
import { useDocument } from "@/contexts/DocumentContext";

interface StudySchemePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBlankLayer: () => void;
  children: React.ReactNode;
}

export function StudySchemePicker({
  open,
  onOpenChange,
  onBlankLayer,
  children,
}: StudySchemePickerProps) {
  const { t } = useTranslation("management");
  const { addLayer, yjs } = useDocument();

  const applyScheme = (schemeId: string) => {
    const scheme = STUDY_SCHEMES.find((s) => s.id === schemeId);
    if (!scheme) return;

    const apply = () => {
      for (const layer of scheme.layers) {
        addLayer({ name: t(layer.nameKey), color: layer.color });
      }
    };

    if (yjs.doc) {
      yjs.doc.transact(apply);
    } else {
      apply();
    }

    onOpenChange(false);
  };

  const handleBlankLayer = () => {
    onBlankLayer();
    onOpenChange(false);
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <PopoverPrimitive.Anchor asChild>{children}</PopoverPrimitive.Anchor>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side="bottom"
          align="start"
          sideOffset={4}
          className="z-50 w-64 rounded-md border bg-popover p-2 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
          data-testid="schemePickerPopover"
        >
          <p className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("schemes.title")}
          </p>
          {STUDY_SCHEMES.map((scheme) => (
            <button
              key={scheme.id}
              className="flex w-full items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
              onClick={() => applyScheme(scheme.id)}
              data-testid={`scheme-${scheme.id}`}
            >
              <div className="text-left">
                <div className="font-medium">{t(scheme.nameKey)}</div>
                <div className="text-xs text-muted-foreground">{t(scheme.descriptionKey)}</div>
              </div>
              <span className="text-xs text-muted-foreground ml-2 shrink-0">
                {t("schemes.layerCount", { count: scheme.layers.length })}
              </span>
            </button>
          ))}
          <div className="my-1 border-t" />
          <button
            className="flex w-full items-center rounded px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
            onClick={handleBlankLayer}
            data-testid="scheme-blank"
          >
            <Plus size={14} className="mr-1.5 text-muted-foreground" />
            {t("schemes.blankLayer")}
          </button>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
