import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import { useForceSave } from "./use-force-save";
import type { WebsocketProvider } from "y-websocket";
import { createMockWsProvider, type MockWsProvider } from "@/test/mocks";

const MSG_FORCE_SAVE = 4;

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "save.saving": "Saving...",
        "save.saved": "Saved.",
        "save.failed": "Save failed.",
        "save.notConnected": "Not connected — cannot save.",
      };
      return map[key] ?? key;
    },
  }),
}));

function fireCtrlS() {
  const event = new KeyboardEvent("keydown", {
    code: "KeyS",
    ctrlKey: true,
    bubbles: true,
  });
  // Track if preventDefault was called
  const spy = vi.spyOn(event, "preventDefault");
  document.dispatchEvent(event);
  return spy;
}

function fireCmdS() {
  const event = new KeyboardEvent("keydown", {
    code: "KeyS",
    metaKey: true,
    bubbles: true,
  });
  document.dispatchEvent(event);
}

function simulateResponse(provider: MockWsProvider, status: number) {
  const handler = provider.messageHandlers[MSG_FORCE_SAVE];
  if (!handler) throw new Error("No handler registered for MSG_FORCE_SAVE");

  // Build a decoder with just the status varuint (message type already consumed)
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, status);
  const data = encoding.toUint8Array(encoder);
  const decoder = decoding.createDecoder(data);

  // Match y-websocket signature: (encoder, decoder, provider, emitSynced, messageType)
  handler(encoding.createEncoder(), decoder, provider, false, MSG_FORCE_SAVE);
}

describe("useForceSave", () => {
  let setStatus: ReturnType<typeof vi.fn>;
  let flashStatus: ReturnType<typeof vi.fn>;
  let clearStatus: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    setStatus = vi.fn();
    flashStatus = vi.fn();
    clearStatus = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("when Ctrl+S is pressed, then calls preventDefault and sends MSG_FORCE_SAVE", () => {
    const provider = createMockWsProvider();
    renderHook(() =>
      useForceSave({
        wsProvider: provider as unknown as WebsocketProvider,
        setStatus,
        flashStatus,
        clearStatus,
      }),
    );

    let spy: ReturnType<typeof vi.spyOn>;
    act(() => {
      spy = fireCtrlS();
    });

    expect(spy!).toHaveBeenCalled();
    expect(provider.ws.send).toHaveBeenCalledOnce();

    // Verify the sent message is a MSG_FORCE_SAVE
    const sent = provider._sent[0];
    const decoder = decoding.createDecoder(sent);
    expect(decoding.readVarUint(decoder)).toBe(MSG_FORCE_SAVE);
  });

  it("when Cmd+S is pressed on Mac, then sends MSG_FORCE_SAVE", () => {
    const provider = createMockWsProvider();
    renderHook(() =>
      useForceSave({
        wsProvider: provider as unknown as WebsocketProvider,
        setStatus,
        flashStatus,
        clearStatus,
      }),
    );

    act(() => {
      fireCmdS();
    });

    expect(provider.ws.send).toHaveBeenCalledOnce();
  });

  it("when Ctrl+S is pressed, then shows 'Saving...' immediately", () => {
    const provider = createMockWsProvider();
    renderHook(() =>
      useForceSave({
        wsProvider: provider as unknown as WebsocketProvider,
        setStatus,
        flashStatus,
        clearStatus,
      }),
    );

    act(() => {
      fireCtrlS();
    });

    expect(setStatus).toHaveBeenCalledWith({ text: "Saving...", type: "info" });
  });

  it("when server responds with success (0), then flashes 'Saved.'", () => {
    const provider = createMockWsProvider();
    renderHook(() =>
      useForceSave({
        wsProvider: provider as unknown as WebsocketProvider,
        setStatus,
        flashStatus,
        clearStatus,
      }),
    );

    act(() => {
      fireCtrlS();
    });
    act(() => {
      simulateResponse(provider, 0);
    });

    expect(flashStatus).toHaveBeenCalledWith({ text: "Saved.", type: "success" }, 3000);
  });

  it("when server responds with error (1), then flashes 'Save failed.'", () => {
    const provider = createMockWsProvider();
    renderHook(() =>
      useForceSave({
        wsProvider: provider as unknown as WebsocketProvider,
        setStatus,
        flashStatus,
        clearStatus,
      }),
    );

    act(() => {
      fireCtrlS();
    });
    act(() => {
      simulateResponse(provider, 1);
    });

    expect(flashStatus).toHaveBeenCalledWith({ text: "Save failed.", type: "error" }, 3000);
  });

  it("when Ctrl+S is pressed while save is in-flight, then ignores it", () => {
    const provider = createMockWsProvider();
    renderHook(() =>
      useForceSave({
        wsProvider: provider as unknown as WebsocketProvider,
        setStatus,
        flashStatus,
        clearStatus,
      }),
    );

    act(() => {
      fireCtrlS();
    });
    act(() => {
      fireCtrlS();
    });

    // Only one send should have been called
    expect(provider.ws.send).toHaveBeenCalledOnce();
  });

  it("when WS is not open, then flashes 'Not connected' error", () => {
    const provider = createMockWsProvider(WebSocket.CLOSED);
    renderHook(() =>
      useForceSave({
        wsProvider: provider as unknown as WebsocketProvider,
        setStatus,
        flashStatus,
        clearStatus,
      }),
    );

    act(() => {
      fireCtrlS();
    });

    expect(provider.ws.send).not.toHaveBeenCalled();
    expect(flashStatus).toHaveBeenCalledWith(
      { text: "Not connected — cannot save.", type: "error" },
      3000,
    );
  });

  it("when wsProvider is null, then flashes 'Not connected' error", () => {
    renderHook(() =>
      useForceSave({
        wsProvider: null,
        setStatus,
        flashStatus,
        clearStatus,
      }),
    );

    act(() => {
      fireCtrlS();
    });

    expect(flashStatus).toHaveBeenCalledWith(
      { text: "Not connected — cannot save.", type: "error" },
      3000,
    );
  });

  it("when no response within 5s, then times out with error flash", () => {
    const provider = createMockWsProvider();
    renderHook(() =>
      useForceSave({
        wsProvider: provider as unknown as WebsocketProvider,
        setStatus,
        flashStatus,
        clearStatus,
      }),
    );

    act(() => {
      fireCtrlS();
    });

    expect(flashStatus).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(flashStatus).toHaveBeenCalledWith({ text: "Save failed.", type: "error" }, 3000);
  });

  it("when response arrives after save, then allows another Ctrl+S", () => {
    const provider = createMockWsProvider();
    renderHook(() =>
      useForceSave({
        wsProvider: provider as unknown as WebsocketProvider,
        setStatus,
        flashStatus,
        clearStatus,
      }),
    );

    act(() => {
      fireCtrlS();
    });
    act(() => {
      simulateResponse(provider, 0);
    });
    act(() => {
      fireCtrlS();
    });

    expect(provider.ws.send).toHaveBeenCalledTimes(2);
  });
});
