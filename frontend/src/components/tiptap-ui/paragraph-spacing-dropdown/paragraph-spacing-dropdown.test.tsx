import { describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithDocument } from "@/test/render-with-document";
import { ParagraphSpacingDropdown } from "./paragraph-spacing-dropdown";

// Mock Yjs doc with a real in-memory Map to simulate document-meta
function makeYjsMap() {
  const store = new Map<string, unknown>();
  const observers = new Set<() => void>();
  return {
    get: (key: string) => store.get(key),
    set: (key: string, value: unknown) => {
      store.set(key, value);
      observers.forEach((fn) => fn());
    },
    observe: (fn: () => void) => observers.add(fn),
    unobserve: (fn: () => void) => observers.delete(fn),
  };
}

let metaMap: ReturnType<typeof makeYjsMap>;

beforeEach(() => {
  metaMap = makeYjsMap();
});

function renderDropdown() {
  const mockDoc = { getMap: () => metaMap };
  return renderWithDocument(<ParagraphSpacingDropdown />, {
    yjs: {
      provider: null,
      doc: mockDoc as never,
      connected: true,
      synced: true,
      getFragment: () => null,
      awareness: null,
    },
  });
}

describe("ParagraphSpacingDropdown", () => {
  it("renders the trigger button", () => {
    renderDropdown();
    expect(screen.getByRole("button", { name: /paragraph spacing/i })).toBeInTheDocument();
  });

  it("clicking trigger opens dropdown with all 3 options", async () => {
    const user = userEvent.setup();
    renderDropdown();

    await user.click(screen.getByRole("button", { name: /paragraph spacing/i }));

    expect(screen.getByText("Normal")).toBeInTheDocument();
    expect(screen.getByText("Compact")).toBeInTheDocument();
    expect(screen.getByText("Tight")).toBeInTheDocument();
  });

  it("selecting an option writes the value to Yjs and closes", async () => {
    const user = userEvent.setup();
    renderDropdown();

    await user.click(screen.getByRole("button", { name: /paragraph spacing/i }));
    await user.click(screen.getByText("Compact"));

    expect(metaMap.get("paragraphSpacing")).toBe("10px");
    // Dropdown should close after selection
    expect(screen.queryByText("Compact")).not.toBeInTheDocument();
  });

  it("Normal option has active state by default", async () => {
    const user = userEvent.setup();
    renderDropdown();

    await user.click(screen.getByRole("button", { name: /paragraph spacing/i }));

    const normalButton = screen.getByText("Normal").closest("button");
    expect(normalButton).toHaveAttribute("data-active-state", "on");
  });

  it("reflects paragraphSpacing from Yjs on mount", async () => {
    metaMap.set("paragraphSpacing", "4px");
    const user = userEvent.setup();
    renderDropdown();

    await user.click(screen.getByRole("button", { name: /paragraph spacing/i }));

    const tightButton = screen.getByText("Tight").closest("button");
    expect(tightButton).toHaveAttribute("data-active-state", "on");
  });

  it("sets CSS variable on document root", async () => {
    const user = userEvent.setup();
    renderDropdown();

    await user.click(screen.getByRole("button", { name: /paragraph spacing/i }));
    await user.click(screen.getByText("Tight"));

    expect(document.documentElement.style.getPropertyValue("--editor-paragraph-spacing")).toBe(
      "4px",
    );
  });
});
