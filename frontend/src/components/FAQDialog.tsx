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

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What is this app?",
    answer:
      "Referencer is a collaborative tool for inductive Bible study. It gives study groups a shared workspace where they can read, annotate, and discuss Scripture together in real time.",
  },
  {
    question: "What is inductive Bible study?",
    answer:
      "Inductive Bible study is a method of reading Scripture that moves from observation (what does the text say?) to interpretation (what does it mean?) to application (how does it apply?). Rather than starting with outside commentary, you let the text speak for itself by carefully examining its words, structure, and context.",
  },
  {
    question: "How does collaboration work?",
    answer:
      "Each workspace can be shared with others via a link. All participants see the same text and can add their own annotations. Changes sync in real time so everyone stays on the same page.",
  },
  {
    question: "What are layers?",
    answer:
      "Layers let you organize annotations into separate groups — for example, one layer for observations and another for interpretations. You can cycle between layers with the L key to focus on one set of annotations at a time.",
  },
  {
    question: "How do annotations work?",
    answer:
      "Lock the editor with the lock button (or press K), then select text to highlight it. You can choose colors, add comments, and draw arrows between annotations to show connections. Click an existing annotation to remove it.",
  },
  {
    question: "What are arrows for?",
    answer:
      "Arrows connect two annotations to show a relationship between passages — for example, linking a repeated word to its first occurrence, or connecting a prophecy to its fulfillment. Select the arrow tool (or press A), then click two annotations to draw a connector.",
  },
  {
    question: "How do I share a workspace?",
    answer:
      "Open the management pane (press M or click the menu icon) and use the share options to generate a link. Anyone with the link can join the workspace and collaborate.",
  },
  {
    question: "Can I use this on mobile?",
    answer:
      "The app works in mobile browsers, but the full annotation and arrow tools are best experienced on a device with a keyboard and mouse.",
  },
];

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex flex-col gap-0 p-0 sm:max-w-lg"
        data-testid="faqDialog"
      >
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Frequently Asked Questions</DialogTitle>
          <DialogDescription>
            Learn about Referencer and how to use it.
          </DialogDescription>
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
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
