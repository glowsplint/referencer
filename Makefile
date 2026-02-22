.PHONY: build docker-dev docker-prod docker-down

build:
	cd frontend && bun run build

docker-dev:
	docker compose up --build

docker-prod:
	docker compose -f docker-compose.prod.yml up -d --build

docker-down:
	docker compose down
	docker compose -f docker-compose.prod.yml down
