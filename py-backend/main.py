from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

LANDING_PAGE = 'index.html'
WORKSPACE_PAGE = 'space.html'
HTML_404_PAGE = './404.html'

async def not_found(request, exc):
    return templates.TemplateResponse(HTML_404_PAGE, {'request': request})

exception_handlers = {
    404: not_found,
}

app = FastAPI(exception_handlers=exception_handlers)
app.mount(
    '/_next/static', StaticFiles(directory='./nextjs-frontend/out/_next/static'), name='static')
app.mount(
    '/public', StaticFiles(directory='./nextjs-frontend/out/public'), name='public')
templates = Jinja2Templates(directory='./nextjs-frontend/out')

@app.get('/')
async def index(request: Request):
    return templates.TemplateResponse(LANDING_PAGE, {'request': request})

@app.get('/space')
async def index(request: Request):
    return templates.TemplateResponse(WORKSPACE_PAGE, {'request': request})