from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

app = FastAPI()
app.mount(
    '/static', StaticFiles(directory='./frontend/static'), name='static')
templates = Jinja2Templates(directory='./frontend')


@app.get('/')
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})
