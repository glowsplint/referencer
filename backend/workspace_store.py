from __future__ import annotations

import json
from collections import defaultdict

import aiosqlite

from .models import (
    ArrowEndpointModel,
    ArrowModel,
    EditorModel,
    HighlightModel,
    LayerModel,
    WorkspaceState,
)


async def get_or_create_workspace(
    db: aiosqlite.Connection, workspace_id: str
) -> None:
    cursor = await db.execute(
        "SELECT id FROM workspace WHERE id = ?", (workspace_id,)
    )
    row = await cursor.fetchone()
    if row is None:
        await db.execute("INSERT INTO workspace (id) VALUES (?)", (workspace_id,))
        await db.execute(
            "INSERT INTO editor (workspace_id, index_pos, name, visible) VALUES (?, 0, 'Passage 1', 1)",
            (workspace_id,),
        )
        await db.commit()


async def get_full_state(
    db: aiosqlite.Connection, workspace_id: str
) -> WorkspaceState:
    # Load layers ordered by position
    cursor = await db.execute(
        "SELECT id, name, color, visible FROM layer WHERE workspace_id = ? ORDER BY position",
        (workspace_id,),
    )
    layer_rows = await cursor.fetchall()

    # Batch-fetch ALL highlights for this workspace via JOIN
    h_cursor = await db.execute(
        'SELECT h.id, h.layer_id, h.editor_index, h."from", h."to", h.text, h.annotation '
        "FROM highlight h "
        "JOIN layer l ON h.layer_id = l.id "
        "WHERE l.workspace_id = ?",
        (workspace_id,),
    )
    h_rows = await h_cursor.fetchall()

    highlights_by_layer: dict[str, list[HighlightModel]] = defaultdict(list)
    for h in h_rows:
        highlights_by_layer[h["layer_id"]].append(
            HighlightModel(
                id=h["id"],
                editorIndex=h["editor_index"],
                from_=h["from"],
                to=h["to"],
                text=h["text"],
                annotation=h["annotation"],
            )
        )

    # Batch-fetch ALL arrows for this workspace via JOIN
    a_cursor = await db.execute(
        "SELECT a.id, a.layer_id, a.from_editor_index, a.from_start, a.from_end, a.from_text, "
        "a.to_editor_index, a.to_start, a.to_end, a.to_text "
        "FROM arrow a "
        "JOIN layer l ON a.layer_id = l.id "
        "WHERE l.workspace_id = ?",
        (workspace_id,),
    )
    a_rows = await a_cursor.fetchall()

    arrows_by_layer: dict[str, list[ArrowModel]] = defaultdict(list)
    for a in a_rows:
        arrows_by_layer[a["layer_id"]].append(
            ArrowModel(
                id=a["id"],
                from_endpoint=ArrowEndpointModel(
                    editorIndex=a["from_editor_index"],
                    from_=a["from_start"],
                    to=a["from_end"],
                    text=a["from_text"],
                ),
                to_endpoint=ArrowEndpointModel(
                    editorIndex=a["to_editor_index"],
                    from_=a["to_start"],
                    to=a["to_end"],
                    text=a["to_text"],
                ),
            )
        )

    # Assemble layers with pre-fetched highlights and arrows
    layers: list[LayerModel] = []
    for lr in layer_rows:
        layer_id = lr["id"]
        layers.append(
            LayerModel(
                id=layer_id,
                name=lr["name"],
                color=lr["color"],
                visible=bool(lr["visible"]),
                highlights=highlights_by_layer.get(layer_id, []),
                arrows=arrows_by_layer.get(layer_id, []),
            )
        )

    # Load editors
    cursor = await db.execute(
        "SELECT index_pos, name, visible, content_json FROM editor WHERE workspace_id = ? ORDER BY index_pos",
        (workspace_id,),
    )
    editor_rows = await cursor.fetchall()
    editors = [
        EditorModel(
            index=e["index_pos"],
            name=e["name"],
            visible=bool(e["visible"]),
            contentJson=json.loads(e["content_json"]) if e["content_json"] else None,
        )
        for e in editor_rows
    ]

    return WorkspaceState(workspaceId=workspace_id, layers=layers, editors=editors)


# --- Layer operations ---


async def add_layer(
    db: aiosqlite.Connection,
    workspace_id: str,
    layer_id: str,
    name: str,
    color: str,
) -> None:
    cursor = await db.execute(
        "SELECT COALESCE(MAX(position), -1) + 1 FROM layer WHERE workspace_id = ?",
        (workspace_id,),
    )
    row = await cursor.fetchone()
    position = row[0]
    await db.execute(
        "INSERT INTO layer (id, workspace_id, name, color, visible, position) VALUES (?, ?, ?, ?, 1, ?)",
        (layer_id, workspace_id, name, color, position),
    )
    await db.commit()


async def remove_layer(
    db: aiosqlite.Connection, workspace_id: str, layer_id: str
) -> None:
    await db.execute(
        "DELETE FROM layer WHERE id = ? AND workspace_id = ?",
        (layer_id, workspace_id),
    )
    await db.commit()


async def update_layer_name(
    db: aiosqlite.Connection, workspace_id: str, layer_id: str, name: str
) -> None:
    await db.execute(
        "UPDATE layer SET name = ? WHERE id = ? AND workspace_id = ?",
        (name, layer_id, workspace_id),
    )
    await db.commit()


async def update_layer_color(
    db: aiosqlite.Connection, workspace_id: str, layer_id: str, color: str
) -> None:
    await db.execute(
        "UPDATE layer SET color = ? WHERE id = ? AND workspace_id = ?",
        (color, layer_id, workspace_id),
    )
    await db.commit()


async def toggle_layer_visibility(
    db: aiosqlite.Connection, workspace_id: str, layer_id: str
) -> None:
    await db.execute(
        "UPDATE layer SET visible = NOT visible WHERE id = ? AND workspace_id = ?",
        (layer_id, workspace_id),
    )
    await db.commit()


async def reorder_layers(
    db: aiosqlite.Connection, workspace_id: str, layer_ids: list[str]
) -> None:
    for position, layer_id in enumerate(layer_ids):
        await db.execute(
            "UPDATE layer SET position = ? WHERE id = ? AND workspace_id = ?",
            (position, layer_id, workspace_id),
        )
    await db.commit()


# --- Highlight operations ---


async def add_highlight(
    db: aiosqlite.Connection,
    layer_id: str,
    highlight_id: str,
    editor_index: int,
    from_pos: int,
    to_pos: int,
    text: str,
    annotation: str = "",
) -> None:
    await db.execute(
        'INSERT INTO highlight (id, layer_id, editor_index, "from", "to", text, annotation) '
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        (highlight_id, layer_id, editor_index, from_pos, to_pos, text, annotation),
    )
    await db.commit()


async def remove_highlight(
    db: aiosqlite.Connection, layer_id: str, highlight_id: str
) -> None:
    await db.execute(
        "DELETE FROM highlight WHERE id = ? AND layer_id = ?",
        (highlight_id, layer_id),
    )
    await db.commit()


async def update_highlight_annotation(
    db: aiosqlite.Connection, layer_id: str, highlight_id: str, annotation: str
) -> None:
    await db.execute(
        "UPDATE highlight SET annotation = ? WHERE id = ? AND layer_id = ?",
        (annotation, highlight_id, layer_id),
    )
    await db.commit()


# --- Arrow operations ---


async def add_arrow(
    db: aiosqlite.Connection,
    layer_id: str,
    arrow_id: str,
    from_endpoint: dict,
    to_endpoint: dict,
) -> None:
    await db.execute(
        "INSERT INTO arrow (id, layer_id, from_editor_index, from_start, from_end, from_text, "
        "to_editor_index, to_start, to_end, to_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            arrow_id,
            layer_id,
            from_endpoint["editorIndex"],
            from_endpoint["from"],
            from_endpoint["to"],
            from_endpoint.get("text", ""),
            to_endpoint["editorIndex"],
            to_endpoint["from"],
            to_endpoint["to"],
            to_endpoint.get("text", ""),
        ),
    )
    await db.commit()


async def remove_arrow(
    db: aiosqlite.Connection, layer_id: str, arrow_id: str
) -> None:
    await db.execute(
        "DELETE FROM arrow WHERE id = ? AND layer_id = ?", (arrow_id, layer_id)
    )
    await db.commit()


# --- Editor operations ---


async def add_editor(
    db: aiosqlite.Connection, workspace_id: str, index: int, name: str
) -> None:
    await db.execute(
        "INSERT INTO editor (workspace_id, index_pos, name, visible) VALUES (?, ?, ?, 1)",
        (workspace_id, index, name),
    )
    await db.commit()


async def remove_editor(
    db: aiosqlite.Connection, workspace_id: str, index: int
) -> None:
    await db.execute(
        "DELETE FROM editor WHERE workspace_id = ? AND index_pos = ?",
        (workspace_id, index),
    )
    # Re-index remaining editors
    cursor = await db.execute(
        "SELECT id, index_pos FROM editor WHERE workspace_id = ? ORDER BY index_pos",
        (workspace_id,),
    )
    rows = await cursor.fetchall()
    for new_index, row in enumerate(rows):
        await db.execute(
            "UPDATE editor SET index_pos = ? WHERE id = ?", (new_index, row[0])
        )
    await db.commit()


async def update_section_name(
    db: aiosqlite.Connection, workspace_id: str, index: int, name: str
) -> None:
    await db.execute(
        "UPDATE editor SET name = ? WHERE workspace_id = ? AND index_pos = ?",
        (name, workspace_id, index),
    )
    await db.commit()


async def toggle_section_visibility(
    db: aiosqlite.Connection, workspace_id: str, index: int
) -> None:
    await db.execute(
        "UPDATE editor SET visible = NOT visible WHERE workspace_id = ? AND index_pos = ?",
        (workspace_id, index),
    )
    await db.commit()


async def update_editor_content(
    db: aiosqlite.Connection, workspace_id: str, editor_index: int, content_json: dict
) -> None:
    await db.execute(
        "UPDATE editor SET content_json = ? WHERE workspace_id = ? AND index_pos = ?",
        (json.dumps(content_json), workspace_id, editor_index),
    )
    await db.commit()
