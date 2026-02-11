import os
from pathlib import Path

import aiosqlite

DATABASE_PATH = os.getenv("DATABASE_PATH", "./data/referencer.db")
MIGRATIONS_DIR = Path(__file__).parent / "migrations"


async def get_db() -> aiosqlite.Connection:
    db = await aiosqlite.connect(DATABASE_PATH)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")
    await db.execute("PRAGMA foreign_keys=ON")
    return db


async def get_schema_version(db: aiosqlite.Connection) -> int:
    try:
        cursor = await db.execute("SELECT MAX(version) FROM schema_version")
        row = await cursor.fetchone()
        return row[0] if row and row[0] is not None else 0
    except aiosqlite.OperationalError:
        return 0


async def run_migrations(db: aiosqlite.Connection):
    current_version = await get_schema_version(db)

    migration_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    for migration_file in migration_files:
        version = int(migration_file.stem.split("_")[0])
        if version <= current_version:
            continue
        sql = migration_file.read_text()
        await db.executescript(sql)
        await db.commit()


async def init_db():
    os.makedirs(os.path.dirname(DATABASE_PATH) or ".", exist_ok=True)
    db = await get_db()
    try:
        await run_migrations(db)
    finally:
        await db.close()
