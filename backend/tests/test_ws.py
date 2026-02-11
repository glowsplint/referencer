import json

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient

from backend.database import init_db, DATABASE_PATH
import backend.database as db_module
from backend.main import app


@pytest_asyncio.fixture(autouse=True)
async def temp_db(tmp_path):
    db_path = str(tmp_path / "test.db")
    db_module.DATABASE_PATH = db_path
    await init_db()
    yield db_path
    db_module.DATABASE_PATH = DATABASE_PATH


def test_websocket_connect_and_receive_state():
    with TestClient(app) as client:
        with client.websocket_connect("/ws/test-workspace") as ws:
            data = ws.receive_json()
            assert data["type"] == "state"
            assert data["payload"]["workspaceId"] == "test-workspace"
            assert len(data["payload"]["editors"]) == 1


def test_websocket_add_layer():
    with TestClient(app) as client:
        with client.websocket_connect("/ws/test-workspace") as ws:
            ws.receive_json()  # Initial state

            ws.send_json({
                "type": "addLayer",
                "payload": {"id": "layer-1", "name": "Layer 1", "color": "#ff0000"},
                "requestId": "req-1",
            })

            ack = ws.receive_json()
            assert ack["type"] == "ack"
            assert ack["requestId"] == "req-1"


def test_websocket_add_highlight():
    with TestClient(app) as client:
        with client.websocket_connect("/ws/test-workspace") as ws:
            ws.receive_json()  # Initial state

            # Add layer first
            ws.send_json({
                "type": "addLayer",
                "payload": {"id": "layer-1", "name": "Layer 1", "color": "#ff0000"},
                "requestId": "req-1",
            })
            ws.receive_json()  # ack

            # Add highlight
            ws.send_json({
                "type": "addHighlight",
                "payload": {
                    "layerId": "layer-1",
                    "highlight": {
                        "id": "h-1",
                        "editorIndex": 0,
                        "from": 5,
                        "to": 10,
                        "text": "hello",
                        "annotation": "",
                    },
                },
                "requestId": "req-2",
            })
            ack = ws.receive_json()
            assert ack["type"] == "ack"


def test_websocket_unknown_action():
    with TestClient(app) as client:
        with client.websocket_connect("/ws/test-workspace") as ws:
            ws.receive_json()  # Initial state

            ws.send_json({
                "type": "unknownAction",
                "payload": {},
                "requestId": "req-1",
            })

            error = ws.receive_json()
            assert error["type"] == "error"
            assert "Unknown action" in error["payload"]["message"]


def test_websocket_state_persists_across_connections():
    with TestClient(app) as client:
        # First connection: add a layer
        with client.websocket_connect("/ws/persist-test") as ws:
            ws.receive_json()  # Initial state
            ws.send_json({
                "type": "addLayer",
                "payload": {"id": "layer-1", "name": "Layer 1", "color": "#ff0000"},
                "requestId": "req-1",
            })
            ws.receive_json()  # ack

        # Second connection: should see the layer
        with client.websocket_connect("/ws/persist-test") as ws:
            data = ws.receive_json()
            assert data["type"] == "state"
            assert len(data["payload"]["layers"]) == 1
            assert data["payload"]["layers"][0]["name"] == "Layer 1"


def test_websocket_broadcast_to_other_clients():
    with TestClient(app) as client:
        with client.websocket_connect("/ws/broadcast-test") as ws1:
            ws1.receive_json()  # Initial state

            with client.websocket_connect("/ws/broadcast-test") as ws2:
                ws2.receive_json()  # Initial state

                # ws1 adds a layer
                ws1.send_json({
                    "type": "addLayer",
                    "payload": {"id": "layer-1", "name": "Layer 1", "color": "#ff0000"},
                    "requestId": "req-1",
                })

                # ws1 should get ack
                ack = ws1.receive_json()
                assert ack["type"] == "ack"

                # ws2 should get broadcast
                broadcast = ws2.receive_json()
                assert broadcast["type"] == "action"
                assert broadcast["payload"]["actionType"] == "addLayer"
                assert broadcast["payload"]["name"] == "Layer 1"
