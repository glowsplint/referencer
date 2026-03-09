// Keyboard shortcut (Ctrl+S / Cmd+S) to force-flush the Yjs document to
// Supabase via a custom binary WebSocket message. Shows save status in the
// status bar and handles timeout / disconnect edge cases.
import { useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { WebsocketProvider } from "y-websocket";
import type { ConnectionManager } from "@/lib/yjs/connection-manager";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import type { StatusMessage } from "./use-status-message";

/** Must match MSG_FORCE_SAVE in collab-server/src/durable-object.ts */
const MSG_FORCE_SAVE = 4;
const SAVE_TIMEOUT_MS = 5000;

interface UseForceSaveOptions {
  wsProvider: WebsocketProvider | null;
  connectionManager: ConnectionManager | null;
  setStatus: (msg: StatusMessage) => void;
  flashStatus: (msg: StatusMessage, duration: number) => void;
  clearStatus: () => void;
}

export function useForceSave({
  wsProvider,
  connectionManager,
  setStatus,
  flashStatus,
  clearStatus,
}: UseForceSaveOptions) {
  const savingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { t } = useTranslation("tools");

  const cleanup = useCallback(() => {
    savingRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!wsProvider) return;

    const handleResponse = (
      _encoder: encoding.Encoder,
      decoder: decoding.Decoder,
      _wsProvider: WebsocketProvider,
      _emitSynced: boolean,
      _messageType: number,
    ) => {
      const status = decoding.readVarUint(decoder);
      cleanup();
      if (status === 0) {
        flashStatus({ text: t("save.saved"), type: "success" }, 3000);
      } else {
        flashStatus({ text: t("save.failed"), type: "error" }, 3000);
      }
    };

    // Register custom message handler for MSG_FORCE_SAVE responses
    wsProvider.messageHandlers[MSG_FORCE_SAVE] = handleResponse;

    return () => {
      delete wsProvider.messageHandlers[MSG_FORCE_SAVE];
    };
  }, [wsProvider, flashStatus, cleanup, t]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "KeyS" || !(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();

      // Guard: already saving
      if (savingRef.current) return;

      // Guard: not connected — also trigger reconnect attempt
      if (!wsProvider || wsProvider.ws?.readyState !== WebSocket.OPEN) {
        flashStatus({ text: t("save.notConnected"), type: "error" }, 3000);
        connectionManager?.forceReconnect();
        return;
      }

      // Mark as saving and show persistent status
      savingRef.current = true;
      setStatus({ text: t("save.saving"), type: "info" });

      // Send MSG_FORCE_SAVE message
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MSG_FORCE_SAVE);
      wsProvider.ws!.send(encoding.toUint8Array(encoder));

      // Timeout fallback
      timeoutRef.current = setTimeout(() => {
        if (savingRef.current) {
          savingRef.current = false;
          timeoutRef.current = null;
          flashStatus({ text: t("save.failed"), type: "error" }, 3000);
        }
      }, SAVE_TIMEOUT_MS);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      cleanup();
    };
  }, [wsProvider, connectionManager, setStatus, flashStatus, clearStatus, cleanup, t]);
}
