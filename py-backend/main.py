from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

app = FastAPI()
app.mount(
    '/_next/static', StaticFiles(directory='./nextjs-frontend/out/_next/static'), name='static')
templates = Jinja2Templates(directory='./nextjs-frontend/out')

@app.get('/')
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})