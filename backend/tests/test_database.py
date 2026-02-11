import os
import tempfile

import pytest
import pytest_asyncio

from backend.database import get_db, init_db, get_schema_version, DATABASE_PATH
import backend.database as db_module


@pytest_asyncio.fixture(autouse=True)
async def temp_db(tmp_path):
    db_path = str(tmp_path / "test.db")
    db_module.DATABASE_PATH = db_path
    yield db_path
    db_module.DATABASE_PATH = DATABASE_PATH


@pytest.mark.asyncio
async def test_init_db_creates_tables(temp_db):
    await init_db()
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        )
        tables = [row[0] for row in await cursor.fetchall()]
        assert "workspace" in tables
        assert "layer" in tables
        assert "highlight" in tables
        assert "arrow" in tables
        assert "editor" in tables
        assert "schema_version" in tables
    finally:
        await db.close()


@pytest.mark.asyncio
async def test_schema_version_is_set(temp_db):
    await init_db()
    db = await get_db()
    try:
        version = await get_schema_version(db)
        assert version == 1
    finally:
        await db.close()


@pytest.mark.asyncio
async def test_init_db_is_idempotent(temp_db):
    await init_db()
    await init_db()  # Should not raise
    db = await get_db()
    try:
        version = await get_schema_version(db)
        assert version == 1
    finally:
        await db.close()
