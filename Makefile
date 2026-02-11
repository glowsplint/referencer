.PHONY: build serve all

build:
	cd frontend && bun run build

serve:
	pipenv run uvicorn backend.main:app --host 127.0.0.1 --port 5000

all:
	build serve
