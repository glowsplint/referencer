import json
import os
from contextlib import asynccontextmanager
from pathlib import Path
from urllib.parse import quote

import requests
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from . import share_store
from .database import get_db, init_db
from .ws import websocket_endpoint

load_dotenv()
DEVELOPMENT_MODE = os.getenv("DEVELOPMENT_MODE")
EXPORTED_PATH = Path("./frontend/dist/")

origins = ["http://127.0.0.1:5000", "http://localhost:5173"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


async def not_found(request, exc):
    return FileResponse(EXPORTED_PATH / "index.html")


exception_handlers = {
    404: not_found,
}

app = FastAPI(exception_handlers=exception_handlers, lifespan=lifespan)
app.mount(
    "/assets",
    StaticFiles(directory=EXPORTED_PATH / "assets"),
    name="assets",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def index():
    return FileResponse(EXPORTED_PATH / "index.html")


@app.get("/space")
async def space():
    return FileResponse(EXPORTED_PATH / "index.html")


@app.get("/space/{workspace_id}")
async def space_with_id(workspace_id: str):
    return FileResponse(EXPORTED_PATH / "index.html")


app.websocket("/ws/{workspace_id}")(websocket_endpoint)


class ShareRequest(BaseModel):
    workspaceId: str
    access: str


@app.post("/api/share")
async def create_share_link(body: ShareRequest):
    if body.access not in ("edit", "readonly"):
        return {"error": "access must be 'edit' or 'readonly'"}
    db = await get_db()
    try:
        code = await share_store.create_share_link(db, body.workspaceId, body.access)
        return {"code": code, "url": f"/s/{code}"}
    finally:
        await db.close()


@app.get("/s/{code}")
async def resolve_share_link(code: str):
    db = await get_db()
    try:
        result = await share_store.resolve_share_link(db, code)
        if result is None:
            return FileResponse(EXPORTED_PATH / "index.html")
        workspace_id, access = result
        if access == "readonly":
            return RedirectResponse(f"/space/{workspace_id}?access=readonly")
        return RedirectResponse(f"/space/{workspace_id}")
    finally:
        await db.close()


@app.get("/api/{query}")
def get_passages(query: str):
    if DEVELOPMENT_MODE:
        return get_development_passages(query)
    else:
        return get_production_passages(query)


def get_production_passages(query: str):
    url = f"https://api.esv.org/v3/passage/text/?q={query}"
    headers = {"Authorization": f'Token {os.environ["API_KEY"]}'}
    params = {"include-short-copyright": False}
    response = requests.get(url, headers=headers, params=params)
    return response.json()


def read_json(path: Path):
    with open(
        Path("./data") / quote(str(path.with_suffix(".json"))),
        "r",
        encoding="utf8",
    ) as f:
        return json.load((f))


def get_development_passages(query: str):
    query_path = Path(query.lower())
    return read_json(query_path)
