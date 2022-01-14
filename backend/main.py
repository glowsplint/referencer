import json
import os
from pathlib import Path
from typing import Optional
from urllib.parse import quote

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, Query, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .spaces import SpacesServer

load_dotenv()
DEVELOPMENT_MODE = os.getenv("DEVELOPMENT_MODE")
EXPORTED_PATH = Path("./frontend/out/")

LANDING_PAGE = "index.html"
WORKSPACE_PAGE = "space.html"
HTML_404_PAGE = "./404.html"

origins = ["http://127.0.0.1:5000"]


async def not_found(request, exc):
    return FileResponse(EXPORTED_PATH / HTML_404_PAGE)


exception_handlers = {
    404: not_found,
}

app = FastAPI(exception_handlers=exception_handlers)
app.mount(
    "/_next/static",
    StaticFiles(directory=EXPORTED_PATH / "_next/static"),
    name="static",
)
app.mount(
    "/public",
    StaticFiles(directory=EXPORTED_PATH / "public"),
    name="public",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

svr = SpacesServer()


@app.get("/")
async def index():
    return FileResponse(EXPORTED_PATH / LANDING_PAGE)


@app.get("/space")
async def space():
    return FileResponse(EXPORTED_PATH / WORKSPACE_PAGE)


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


@app.websocket("/ws/logon")
async def websocket_logon(
    websocket: WebSocket, username: Optional[str] = None, space_id: Optional[str] = None
):
    await websocket.accept()
    if space_id is None:
        space_id = svr.space_create()
        print(f"Created new space {space_id}")
    usr_token = svr.user_add(space_id, username)
    await websocket.send_json({"u": usr_token, "r": space_id})
    await websocket.close()


@app.websocket("/ws/r")
async def websocket_room(
    websocket: WebSocket, u: Optional[str] = None, r: Optional[str] = None
):
    await websocket.accept()
    if u is None or r is None:
        websocket.close()
    else:
        await svr.user_connect(r, u)
