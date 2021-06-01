import requests
from config import API_KEY
from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

LANDING_PAGE = 'index.html'
WORKSPACE_PAGE = 'space.html'
HTML_404_PAGE = './404.html'

origins = [
    "http://127.0.0.1:5000"
]



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

app.add_middleware(CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/')
async def index(request: Request):
    return templates.TemplateResponse(LANDING_PAGE, {'request': request})

@app.get('/space')
async def index(request: Request):
    return templates.TemplateResponse(WORKSPACE_PAGE, {'request': request})

@app.get('/space')
async def index(request: Request):
    return templates.TemplateResponse(WORKSPACE_PAGE, {'request': request})

@app.get("/api/{query}")
def get_passages(query: str):
    url = f"https://api.esv.org/v3/passage/text/?q={query}"
    headers = {
        'Authorization': f'Token {API_KEY}'
    }
    params = {
        'include-short-copyright': False
    }
    response = requests.get(url, headers=headers, params=params)
    return response.json()