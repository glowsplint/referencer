import uvicorn

if __name__ == '__main__':
    uvicorn.run('referencer.main:app', host='127.0.0.1', port=5000,
                reload=True, debug=False, workers=1)
