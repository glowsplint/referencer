import json
import os
from pathlib import Path
from urllib.parse import quote

import requests
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

load_dotenv()
DEVELOPMENT_MODE = os.getenv("DEVELOPMENT_MODE")
EXPORTED_PATH = Path("./frontend/dist/")

origins = ["http://127.0.0.1:5000"]


async def not_found(request, exc):
    return FileResponse(EXPORTED_PATH / "index.html")


exception_handlers = {
    404: not_found,
}

app = FastAPI(exception_handlers=exception_handlers)
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
