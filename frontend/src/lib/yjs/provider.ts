// Yjs document and WebSocket provider management.
// Creates a Y.Doc per document with named XmlFragments for each editor pane.
// Connects to the collab server via y-websocket's WebsocketProvider.
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

const WS_URL =
  import.meta.env.VITE_COLLAB_WS_URL ??
  `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/yjs`;

export interface DocumentProvider {
  doc: Y.Doc;
  wsProvider: WebsocketProvider;
  /** Get or create the XmlFragment for editor pane `index` */
  getFragment(index: number): Y.XmlFragment;
  /** Awareness instance for cursor/presence */
  awareness: WebsocketProvider["awareness"];
  destroy(): void;
}

/**
 * Create a Yjs document provider for the given document ID.
 * The Y.Doc contains:
 *   - XmlFragment("editor-0"), XmlFragment("editor-1"), ... for text content
 *   - Array("layers") for annotation layers (Phase 2)
 *   - Map("editors-meta") for editor metadata (Phase 2)
 */
export function createDocumentProvider(documentId: string, token?: string): DocumentProvider {
  const doc = new Y.Doc();

  const wsProvider = new WebsocketProvider(WS_URL, documentId, doc, {
    connect: true,
    params: token ? { token } : {},
  });

  const getFragment = (index: number): Y.XmlFragment => {
    return doc.getXmlFragment(`editor-${index}`);
  };

  const destroy = () => {
    wsProvider.disconnect();
    wsProvider.destroy();
    doc.destroy();
  };

  return {
    doc,
    wsProvider,
    getFragment,
    awareness: wsProvider.awareness,
    destroy,
  };
}
