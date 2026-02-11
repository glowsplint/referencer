from __future__ import annotations

import json

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

    layers: list[LayerModel] = []
    for lr in layer_rows:
        layer_id = lr[0]

        # Load highlights for this layer
        h_cursor = await db.execute(
            'SELECT id, editor_index, "from", "to", text, annotation FROM highlight WHERE layer_id = ?',
            (layer_id,),
        )
        h_rows = await h_cursor.fetchall()
        highlights = [
            HighlightModel(
                id=h[0],
                editorIndex=h[1],
                from_=h[2],
                to=h[3],
                text=h[4],
                annotation=h[5],
            )
            for h in h_rows
        ]

        # Load arrows for this layer
        a_cursor = await db.execute(
            "SELECT id, from_editor_index, from_start, from_end, from_text, "
            "to_editor_index, to_start, to_end, to_text FROM arrow WHERE layer_id = ?",
            (layer_id,),
        )
        a_rows = await a_cursor.fetchall()
        arrows = [
            ArrowModel(
                id=a[0],
                from_endpoint=ArrowEndpointModel(
                    editorIndex=a[1], from_=a[2], to=a[3], text=a[4]
                ),
                to_endpoint=ArrowEndpointModel(
                    editorIndex=a[5], from_=a[6], to=a[7], text=a[8]
                ),
            )
            for a in a_rows
        ]

        layers.append(
            LayerModel(
                id=layer_id,
                name=lr[1],
                color=lr[2],
                visible=bool(lr[3]),
                highlights=highlights,
                arrows=arrows,
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
            index=e[0],
            name=e[1],
            visible=bool(e[2]),
            contentJson=json.loads(e[3]) if e[3] else None,
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
