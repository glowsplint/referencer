from __future__ import annotations

import secrets
import string

import aiosqlite

CHARSET = string.ascii_letters + string.digits
CODE_LENGTH = 6
MAX_RETRIES = 5


def _generate_code() -> str:
    return "".join(secrets.choice(CHARSET) for _ in range(CODE_LENGTH))


async def create_share_link(
    db: aiosqlite.Connection, workspace_id: str, access: str
) -> str:
    """Create a share link and return the generated code."""
    for _ in range(MAX_RETRIES):
        code = _generate_code()
        try:
            await db.execute(
                "INSERT INTO share_link (code, workspace_id, access) VALUES (?, ?, ?)",
                (code, workspace_id, access),
            )
            await db.commit()
            return code
        except aiosqlite.IntegrityError:
            continue
    raise RuntimeError("Failed to generate unique share code")


async def resolve_share_link(
    db: aiosqlite.Connection, code: str
) -> tuple[str, str] | None:
    """Return (workspace_id, access) for a share code, or None if not found."""
    cursor = await db.execute(
        "SELECT workspace_id, access FROM share_link WHERE code = ?", (code,)
    )
    row = await cursor.fetchone()
    if row is None:
        return None
    return row[0], row[1]
