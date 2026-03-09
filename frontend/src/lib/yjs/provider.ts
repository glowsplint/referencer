// Yjs document and WebSocket provider management.
// Creates a Y.Doc per document with named XmlFragments for each editor pane.
// Connects to the collab server via y-websocket's WebsocketProvider.
// ConnectionManager owns the reconnection schedule to prevent storms.
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { ConnectionManager, type ConnectionState } from "./connection-manager";

const WS_URL =
  import.meta.env.VITE_COLLAB_WS_URL ??
  `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/yjs`;

export interface DocumentProvider {
  doc: Y.Doc;
  wsProvider: WebsocketProvider;
  connectionManager: ConnectionManager;
  /** Get or create the XmlFragment for editor pane `index` */
  getFragment(index: number): Y.XmlFragment;
  /** Awareness instance for cursor/presence */
  awareness: WebsocketProvider["awareness"];
  destroy(): void;
}

export type { ConnectionState };

/**
 * Create a Yjs document provider for the given document ID.
 * The Y.Doc contains:
 *   - XmlFragment("editor-0"), XmlFragment("editor-1"), ... for text content
 *   - Array("layers") for annotation layers (Phase 2)
 *   - Map("editors-meta") for editor metadata (Phase 2)
 *
 * `connect: false` — ConnectionManager calls connect() after setup.
 * `maxBackoffTime: 30_000` — caps y-websocket's internal backoff for failed upgrades.
 */
export function createDocumentProvider(
  documentId: string,
  refreshToken: () => Promise<string | undefined>,
  options?: {
    token?: string;
    onConnectionStateChange?: (state: ConnectionState) => void;
  },
): DocumentProvider {
  const doc = new Y.Doc();

  const wsProvider = new WebsocketProvider(WS_URL, documentId, doc, {
    connect: false,
    params: options?.token ? { token: options.token } : {},
    maxBackoffTime: 30_000,
  });

  const connectionManager = new ConnectionManager(wsProvider, refreshToken, {
    onStateChange: options?.onConnectionStateChange,
  });

  const getFragment = (index: number): Y.XmlFragment => {
    return doc.getXmlFragment(`editor-${index}`);
  };

  const destroy = () => {
    connectionManager.destroy();
    wsProvider.disconnect();
    wsProvider.destroy();
    doc.destroy();
  };

  return {
    doc,
    wsProvider,
    connectionManager,
    getFragment,
    awareness: wsProvider.awareness,
    destroy,
  };
}
