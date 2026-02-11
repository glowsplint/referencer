import pytest
import pytest_asyncio

from backend.database import get_db, init_db, DATABASE_PATH
import backend.database as db_module
from backend import workspace_store as store


@pytest_asyncio.fixture(autouse=True)
async def temp_db(tmp_path):
    db_path = str(tmp_path / "test.db")
    db_module.DATABASE_PATH = db_path
    await init_db()
    yield db_path
    db_module.DATABASE_PATH = DATABASE_PATH


@pytest_asyncio.fixture
async def db():
    conn = await get_db()
    yield conn
    await conn.close()


@pytest.mark.asyncio
async def test_get_or_create_workspace(db):
    await store.get_or_create_workspace(db, "ws-1")
    state = await store.get_full_state(db, "ws-1")
    assert state.workspaceId == "ws-1"
    assert len(state.editors) == 1
    assert state.editors[0].name == "Passage 1"


@pytest.mark.asyncio
async def test_get_or_create_workspace_idempotent(db):
    await store.get_or_create_workspace(db, "ws-1")
    await store.get_or_create_workspace(db, "ws-1")
    state = await store.get_full_state(db, "ws-1")
    assert len(state.editors) == 1


@pytest.mark.asyncio
async def test_add_and_remove_layer(db):
    await store.get_or_create_workspace(db, "ws-1")
    await store.add_layer(db, "ws-1", "layer-1", "Test Layer", "#ff0000")
    state = await store.get_full_state(db, "ws-1")
    assert len(state.layers) == 1
    assert state.layers[0].name == "Test Layer"
    assert state.layers[0].color == "#ff0000"

    await store.remove_layer(db, "ws-1", "layer-1")
    state = await store.get_full_state(db, "ws-1")
    assert len(state.layers) == 0


@pytest.mark.asyncio
async def test_update_layer_name(db):
    await store.get_or_create_workspace(db, "ws-1")
    await store.add_layer(db, "ws-1", "layer-1", "Old Name", "#ff0000")
    await store.update_layer_name(db, "ws-1", "layer-1", "New Name")
    state = await store.get_full_state(db, "ws-1")
    assert state.layers[0].name == "New Name"


@pytest.mark.asyncio
async def test_update_layer_color(db):
    await store.get_or_create_workspace(db, "ws-1")
    await store.add_layer(db, "ws-1", "layer-1", "Layer", "#ff0000")
    await store.update_layer_color(db, "ws-1", "layer-1", "#00ff00")
    state = await store.get_full_state(db, "ws-1")
    assert state.layers[0].color == "#00ff00"


@pytest.mark.asyncio
async def test_toggle_layer_visibility(db):
    await store.get_or_create_workspace(db, "ws-1")
    await store.add_layer(db, "ws-1", "layer-1", "Layer", "#ff0000")
    assert (await store.get_full_state(db, "ws-1")).layers[0].visible is True

    await store.toggle_layer_visibility(db, "ws-1", "layer-1")
    assert (await store.get_full_state(db, "ws-1")).layers[0].visible is False

    await store.toggle_layer_visibility(db, "ws-1", "layer-1")
    assert (await store.get_full_state(db, "ws-1")).layers[0].visible is True


@pytest.mark.asyncio
async def test_reorder_layers(db):
    await store.get_or_create_workspace(db, "ws-1")
    await store.add_layer(db, "ws-1", "a", "A", "#ff0000")
    await store.add_layer(db, "ws-1", "b", "B", "#00ff00")
    await store.add_layer(db, "ws-1", "c", "C", "#0000ff")

    await store.reorder_layers(db, "ws-1", ["c", "a", "b"])
    state = await store.get_full_state(db, "ws-1")
    assert [l.id for l in state.layers] == ["c", "a", "b"]


@pytest.mark.asyncio
async def test_add_and_remove_highlight(db):
    await store.get_or_create_workspace(db, "ws-1")
    await store.add_layer(db, "ws-1", "layer-1", "Layer", "#ff0000")
    await store.add_highlight(db, "layer-1", "h-1", 0, 5, 10, "hello", "note")

    state = await store.get_full_state(db, "ws-1")
    h = state.layers[0].highlights[0]
    assert h.id == "h-1"
    assert h.editorIndex == 0
    assert h.text == "hello"
    assert h.annotation == "note"

    await store.remove_highlight(db, "layer-1", "h-1")
    state = await store.get_full_state(db, "ws-1")
    assert len(state.layers[0].highlights) == 0


@pytest.mark.asyncio
async def test_update_highlight_annotation(db):
    await store.get_or_create_workspace(db, "ws-1")
    await store.add_layer(db, "ws-1", "layer-1", "Layer", "#ff0000")
    await store.add_highlight(db, "layer-1", "h-1", 0, 5, 10, "hello", "old")

    await store.update_highlight_annotation(db, "layer-1", "h-1", "new")
    state = await store.get_full_state(db, "ws-1")
    assert state.layers[0].highlights[0].annotation == "new"


@pytest.mark.asyncio
async def test_add_and_remove_arrow(db):
    await store.get_or_create_workspace(db, "ws-1")
    await store.add_layer(db, "ws-1", "layer-1", "Layer", "#ff0000")

    from_ep = {"editorIndex": 0, "from": 1, "to": 5, "text": "from"}
    to_ep = {"editorIndex": 1, "from": 10, "to": 15, "text": "to"}
    await store.add_arrow(db, "layer-1", "arrow-1", from_ep, to_ep)

    state = await store.get_full_state(db, "ws-1")
    arrow = state.layers[0].arrows[0]
    assert arrow.id == "arrow-1"
    arrow_dict = arrow.model_dump()
    assert arrow_dict["from"]["editorIndex"] == 0
    assert arrow_dict["to"]["text"] == "to"

    await store.remove_arrow(db, "layer-1", "arrow-1")
    state = await store.get_full_state(db, "ws-1")
    assert len(state.layers[0].arrows) == 0


@pytest.mark.asyncio
async def test_add_and_remove_editor(db):
    await store.get_or_create_workspace(db, "ws-1")
    state = await store.get_full_state(db, "ws-1")
    assert len(state.editors) == 1

    await store.add_editor(db, "ws-1", 1, "Passage 2")
    state = await store.get_full_state(db, "ws-1")
    assert len(state.editors) == 2
    assert state.editors[1].name == "Passage 2"

    await store.remove_editor(db, "ws-1", 0)
    state = await store.get_full_state(db, "ws-1")
    assert len(state.editors) == 1
    assert state.editors[0].index == 0
    assert state.editors[0].name == "Passage 2"


@pytest.mark.asyncio
async def test_update_section_name(db):
    await store.get_or_create_workspace(db, "ws-1")
    await store.update_section_name(db, "ws-1", 0, "Renamed")
    state = await store.get_full_state(db, "ws-1")
    assert state.editors[0].name == "Renamed"


@pytest.mark.asyncio
async def test_toggle_section_visibility(db):
    await store.get_or_create_workspace(db, "ws-1")
    assert (await store.get_full_state(db, "ws-1")).editors[0].visible is True

    await store.toggle_section_visibility(db, "ws-1", 0)
    assert (await store.get_full_state(db, "ws-1")).editors[0].visible is False


@pytest.mark.asyncio
async def test_update_editor_content(db):
    await store.get_or_create_workspace(db, "ws-1")
    content = {"type": "doc", "content": [{"type": "paragraph"}]}
    await store.update_editor_content(db, "ws-1", 0, content)
    state = await store.get_full_state(db, "ws-1")
    assert state.editors[0].contentJson == content
