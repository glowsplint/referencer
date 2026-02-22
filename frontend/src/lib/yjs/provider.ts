// Yjs document and WebSocket provider management.
// Creates a Y.Doc per workspace with named XmlFragments for each editor pane.
// Connects to the collab server via y-websocket's WebsocketProvider.
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

const WS_URL =
  import.meta.env.VITE_COLLAB_WS_URL ??
  `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/yjs`;

export interface WorkspaceProvider {
  doc: Y.Doc;
  wsProvider: WebsocketProvider;
  /** Get or create the XmlFragment for editor pane `index` */
  getFragment(index: number): Y.XmlFragment;
  /** Awareness instance for cursor/presence */
  awareness: WebsocketProvider["awareness"];
  destroy(): void;
}

/**
 * Create a Yjs workspace provider for the given workspace ID.
 * The Y.Doc contains:
 *   - XmlFragment("editor-0"), XmlFragment("editor-1"), ... for text content
 *   - Array("layers") for annotation layers (Phase 2)
 *   - Map("editors-meta") for editor metadata (Phase 2)
 */
export function createWorkspaceProvider(workspaceId: string): WorkspaceProvider {
  const doc = new Y.Doc();

  const wsProvider = new WebsocketProvider(WS_URL, workspaceId, doc, {
    connect: true,
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
