import { describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithWorkspace } from "@/test/render-with-workspace";
import { LineHeightDropdown } from "./line-height-dropdown";

// Mock Yjs doc with a real in-memory Map to simulate workspace-meta
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
  return renderWithWorkspace(<LineHeightDropdown />, {
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

describe("LineHeightDropdown", () => {
  it("renders the trigger button", () => {
    renderDropdown();
    expect(screen.getByRole("button", { name: /line height/i })).toBeInTheDocument();
  });

  it("clicking trigger opens dropdown with all 4 options", async () => {
    const user = userEvent.setup();
    renderDropdown();

    await user.click(screen.getByRole("button", { name: /line height/i }));

    expect(screen.getByText("Compact")).toBeInTheDocument();
    expect(screen.getByText("Normal")).toBeInTheDocument();
    expect(screen.getByText("Relaxed")).toBeInTheDocument();
    expect(screen.getByText("Loose")).toBeInTheDocument();
  });

  it("selecting an option writes the value to Yjs and closes", async () => {
    const user = userEvent.setup();
    renderDropdown();

    await user.click(screen.getByRole("button", { name: /line height/i }));
    await user.click(screen.getByText("Relaxed"));

    expect(metaMap.get("lineHeight")).toBe(1.8);
    // Dropdown should close after selection
    expect(screen.queryByText("Relaxed")).not.toBeInTheDocument();
  });

  it("Normal option has active state by default", async () => {
    const user = userEvent.setup();
    renderDropdown();

    await user.click(screen.getByRole("button", { name: /line height/i }));

    const normalButton = screen.getByText("Normal").closest("button");
    expect(normalButton).toHaveAttribute("data-active-state", "on");
  });

  it("reflects lineHeight from Yjs on mount", async () => {
    metaMap.set("lineHeight", 2.0);
    const user = userEvent.setup();
    renderDropdown();

    await user.click(screen.getByRole("button", { name: /line height/i }));

    const looseButton = screen.getByText("Loose").closest("button");
    expect(looseButton).toHaveAttribute("data-active-state", "on");
  });

  it("sets CSS variable on document root", async () => {
    const user = userEvent.setup();
    renderDropdown();

    await user.click(screen.getByRole("button", { name: /line height/i }));
    await user.click(screen.getByText("Compact"));

    expect(document.documentElement.style.getPropertyValue("--editor-line-height")).toBe("1.2");
  });
});
