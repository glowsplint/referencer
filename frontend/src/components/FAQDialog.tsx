// Modal dialog displaying frequently asked questions about the app, covering
// what Referencer is, how layers/annotations/arrows/sharing work, etc.
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface FAQItem {
  question: string;
  answer: string;
}

function FAQEntry({ item }: { item: FAQItem }) {
  return (
    <div>
      <h3 className="text-sm font-medium mb-1">{item.question}</h3>
      <p className="text-sm text-muted-foreground">{item.answer}</p>
    </div>
  );
}

interface FAQDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FAQDialog({ open, onOpenChange }: FAQDialogProps) {
  const { t } = useTranslation("dialogs");
  const { t: tc } = useTranslation("common");

  const FAQ_ITEMS: FAQItem[] = [
    {
      question: t("faq.items.whatIsApp.question"),
      answer: t("faq.items.whatIsApp.answer"),
    },
    {
      question: t("faq.items.inductiveStudy.question"),
      answer: t("faq.items.inductiveStudy.answer"),
    },
    {
      question: t("faq.items.collaboration.question"),
      answer: t("faq.items.collaboration.answer"),
    },
    {
      question: t("faq.items.layers.question"),
      answer: t("faq.items.layers.answer"),
    },
    {
      question: t("faq.items.annotations.question"),
      answer: t("faq.items.annotations.answer"),
    },
    {
      question: t("faq.items.arrows.question"),
      answer: t("faq.items.arrows.answer"),
    },
    {
      question: t("faq.items.sharing.question"),
      answer: t("faq.items.sharing.answer"),
    },
    {
      question: t("faq.items.mobile.question"),
      answer: t("faq.items.mobile.answer"),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex flex-col gap-0 p-0 sm:max-w-lg"
        data-testid="faqDialog"
      >
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>{t("faq.title")}</DialogTitle>
          <DialogDescription>{t("faq.description")}</DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[60vh]">
          <div className="px-6 pb-4 space-y-4">
            {FAQ_ITEMS.map((item) => (
              <FAQEntry key={item.question} item={item} />
            ))}
          </div>
        </div>
        <DialogFooter className="sticky bottom-0 border-t bg-background p-4">
          <DialogClose asChild>
            <Button variant="outline" data-testid="faqCloseButton">
              {tc("close")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
