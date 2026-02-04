.PHONY: help install dev build ollama-ui stop-ui clean

help:
	@echo "Marrow - AI Job Hunting Agent"
	@echo ""
	@echo "Available commands:"
	@echo "  make install     - Install dependencies"
	@echo "  make dev         - Run in development mode"
	@echo "  make build       - Build TypeScript"
	@echo "  make ollama-ui   - Start Ollama WebUI for debugging (requires Docker)"
	@echo "  make stop-ui     - Stop Ollama WebUI"
	@echo "  make clean       - Remove build artifacts"

install:
	npm install

dev:
	npm run dev

build:
	npm run build

ollama-ui:
	docker run -d -p 8080:8080 -e OLLAMA_BASE_URL=http://host.docker.internal:11434 --name ollama-ui ghcr.io/open-webui/open-webui:latest
	@echo "Ollama WebUI started at http://localhost:8080"

stop-ui:
	docker stop ollama-ui && docker rm ollama-ui || true
	@echo "Ollama WebUI stopped"

clean:
	rm -rf dist node_modules
	npm install
