from __future__ import annotations

import json
import logging
import uuid
from typing import Any

from fastapi import WebSocket, WebSocketDisconnect

from . import workspace_store as store
from .database import get_db
from .models import ClientMessage, ServerMessage

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # workspace_id -> {client_id -> WebSocket}
        self.connections: dict[str, dict[str, WebSocket]] = {}

    async def connect(self, workspace_id: str, websocket: WebSocket) -> str:
        await websocket.accept()
        client_id = str(uuid.uuid4())
        if workspace_id not in self.connections:
            self.connections[workspace_id] = {}
        self.connections[workspace_id][client_id] = websocket
        return client_id

    def disconnect(self, workspace_id: str, client_id: str) -> None:
        if workspace_id in self.connections:
            self.connections[workspace_id].pop(client_id, None)
            if not self.connections[workspace_id]:
                del self.connections[workspace_id]

    async def send_to(self, workspace_id: str, client_id: str, message: dict) -> None:
        ws = self.connections.get(workspace_id, {}).get(client_id)
        if ws:
            await ws.send_json(message)

    async def broadcast(
        self,
        workspace_id: str,
        message: dict,
        exclude_client: str | None = None,
    ) -> None:
        clients = self.connections.get(workspace_id, {})
        for cid, ws in list(clients.items()):
            if cid == exclude_client:
                continue
            try:
                await ws.send_json(message)
            except Exception:
                logger.warning("Failed to send to client %s", cid)


manager = ConnectionManager()


ACTION_HANDLERS: dict[str, Any] = {
    "addLayer": "_handle_add_layer",
    "removeLayer": "_handle_remove_layer",
    "updateLayerName": "_handle_update_layer_name",
    "updateLayerColor": "_handle_update_layer_color",
    "toggleLayerVisibility": "_handle_toggle_layer_visibility",
    "reorderLayers": "_handle_reorder_layers",
    "addHighlight": "_handle_add_highlight",
    "removeHighlight": "_handle_remove_highlight",
    "updateHighlightAnnotation": "_handle_update_highlight_annotation",
    "addArrow": "_handle_add_arrow",
    "removeArrow": "_handle_remove_arrow",
    "addEditor": "_handle_add_editor",
    "removeEditor": "_handle_remove_editor",
    "updateSectionName": "_handle_update_section_name",
    "toggleSectionVisibility": "_handle_toggle_section_visibility",
    "updateEditorContent": "_handle_update_editor_content",
}


async def _handle_add_layer(db, workspace_id, payload):
    await store.add_layer(
        db, workspace_id, payload["id"], payload["name"], payload["color"]
    )


async def _handle_remove_layer(db, workspace_id, payload):
    await store.remove_layer(db, workspace_id, payload["id"])


async def _handle_update_layer_name(db, workspace_id, payload):
    await store.update_layer_name(db, workspace_id, payload["id"], payload["name"])


async def _handle_update_layer_color(db, workspace_id, payload):
    await store.update_layer_color(db, workspace_id, payload["id"], payload["color"])


async def _handle_toggle_layer_visibility(db, workspace_id, payload):
    await store.toggle_layer_visibility(db, workspace_id, payload["id"])


async def _handle_reorder_layers(db, workspace_id, payload):
    await store.reorder_layers(db, workspace_id, payload["layerIds"])


async def _handle_add_highlight(db, workspace_id, payload):
    h = payload["highlight"]
    await store.add_highlight(
        db,
        payload["layerId"],
        h["id"],
        h["editorIndex"],
        h["from"],
        h["to"],
        h.get("text", ""),
        h.get("annotation", ""),
    )


async def _handle_remove_highlight(db, workspace_id, payload):
    await store.remove_highlight(db, payload["layerId"], payload["highlightId"])


async def _handle_update_highlight_annotation(db, workspace_id, payload):
    await store.update_highlight_annotation(
        db, payload["layerId"], payload["highlightId"], payload["annotation"]
    )


async def _handle_add_arrow(db, workspace_id, payload):
    arrow = payload["arrow"]
    await store.add_arrow(
        db, payload["layerId"], arrow["id"], arrow["from"], arrow["to"]
    )


async def _handle_remove_arrow(db, workspace_id, payload):
    await store.remove_arrow(db, payload["layerId"], payload["arrowId"])


async def _handle_add_editor(db, workspace_id, payload):
    await store.add_editor(db, workspace_id, payload["index"], payload["name"])


async def _handle_remove_editor(db, workspace_id, payload):
    await store.remove_editor(db, workspace_id, payload["index"])


async def _handle_update_section_name(db, workspace_id, payload):
    await store.update_section_name(
        db, workspace_id, payload["index"], payload["name"]
    )


async def _handle_toggle_section_visibility(db, workspace_id, payload):
    await store.toggle_section_visibility(db, workspace_id, payload["index"])


async def _handle_update_editor_content(db, workspace_id, payload):
    await store.update_editor_content(
        db, workspace_id, payload["editorIndex"], payload["contentJson"]
    )


_handler_functions = {
    name: func
    for name, func_name in ACTION_HANDLERS.items()
    for func in [globals()[func_name]]
}


async def websocket_endpoint(websocket: WebSocket, workspace_id: str):
    client_id = await manager.connect(workspace_id, websocket)
    db = await get_db()

    try:
        # Initialize workspace and send full state
        await store.get_or_create_workspace(db, workspace_id)
        state = await store.get_full_state(db, workspace_id)

        state_dict = state.model_dump()
        await manager.send_to(
            workspace_id,
            client_id,
            {"type": "state", "payload": state_dict},
        )

        # Message loop
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)
            msg = ClientMessage(**data)

            handler = _handler_functions.get(msg.type)
            if handler is None:
                await manager.send_to(
                    workspace_id,
                    client_id,
                    ServerMessage(
                        type="error",
                        payload={"message": f"Unknown action: {msg.type}"},
                        requestId=msg.requestId,
                    ).model_dump(),
                )
                continue

            try:
                await handler(db, workspace_id, msg.payload)
            except Exception as e:
                logger.exception("Error handling action %s", msg.type)
                await manager.send_to(
                    workspace_id,
                    client_id,
                    ServerMessage(
                        type="error",
                        payload={"message": str(e)},
                        requestId=msg.requestId,
                    ).model_dump(),
                )
                continue

            # Ack to sender
            await manager.send_to(
                workspace_id,
                client_id,
                ServerMessage(
                    type="ack",
                    payload={},
                    requestId=msg.requestId,
                ).model_dump(),
            )

            # Broadcast to other clients
            await manager.broadcast(
                workspace_id,
                ServerMessage(
                    type="action",
                    payload={"actionType": msg.type, **msg.payload},
                    sourceClientId=client_id,
                ).model_dump(),
                exclude_client=client_id,
            )

    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("WebSocket error for workspace %s", workspace_id)
    finally:
        manager.disconnect(workspace_id, client_id)
        await db.close()
