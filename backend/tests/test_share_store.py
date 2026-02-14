import pytest
import pytest_asyncio

from backend.database import get_db, init_db, DATABASE_PATH
import backend.database as db_module
from backend import share_store


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
async def test_create_share_link(db):
    # Need a workspace first
    await db.execute("INSERT INTO workspace (id) VALUES (?)", ("ws-1",))
    await db.commit()

    code = await share_store.create_share_link(db, "ws-1", "edit")
    assert len(code) == 6
    assert code.isalnum()


@pytest.mark.asyncio
async def test_create_share_link_readonly(db):
    await db.execute("INSERT INTO workspace (id) VALUES (?)", ("ws-1",))
    await db.commit()

    code = await share_store.create_share_link(db, "ws-1", "readonly")
    assert len(code) == 6


@pytest.mark.asyncio
async def test_resolve_share_link(db):
    await db.execute("INSERT INTO workspace (id) VALUES (?)", ("ws-1",))
    await db.commit()

    code = await share_store.create_share_link(db, "ws-1", "edit")
    result = await share_store.resolve_share_link(db, code)
    assert result is not None
    workspace_id, access = result
    assert workspace_id == "ws-1"
    assert access == "edit"


@pytest.mark.asyncio
async def test_resolve_share_link_readonly(db):
    await db.execute("INSERT INTO workspace (id) VALUES (?)", ("ws-1",))
    await db.commit()

    code = await share_store.create_share_link(db, "ws-1", "readonly")
    result = await share_store.resolve_share_link(db, code)
    assert result is not None
    workspace_id, access = result
    assert workspace_id == "ws-1"
    assert access == "readonly"


@pytest.mark.asyncio
async def test_resolve_nonexistent_code(db):
    result = await share_store.resolve_share_link(db, "ZZZZZZ")
    assert result is None


@pytest.mark.asyncio
async def test_unique_codes(db):
    await db.execute("INSERT INTO workspace (id) VALUES (?)", ("ws-1",))
    await db.commit()

    codes = set()
    for _ in range(10):
        code = await share_store.create_share_link(db, "ws-1", "edit")
        codes.add(code)
    assert len(codes) == 10


@pytest.mark.asyncio
async def test_multiple_links_per_workspace(db):
    await db.execute("INSERT INTO workspace (id) VALUES (?)", ("ws-1",))
    await db.commit()

    code_edit = await share_store.create_share_link(db, "ws-1", "edit")
    code_ro = await share_store.create_share_link(db, "ws-1", "readonly")

    result_edit = await share_store.resolve_share_link(db, code_edit)
    result_ro = await share_store.resolve_share_link(db, code_ro)

    assert result_edit == ("ws-1", "edit")
    assert result_ro == ("ws-1", "readonly")
