.PHONY: help install dev build ollama-ui stop-ui clean snapshot-list snapshot-pages snapshot test-selectors

help:
	@echo "Marrow - AI Job Hunting Agent"
	@echo ""
	@echo "Available commands:"
	@echo "  make install       - Install dependencies"
	@echo "  make dev           - Run in development mode"
	@echo "  make build         - Build TypeScript"
	@echo "  make snapshot-list - List all available modules"
	@echo "  make snapshot-pages - List pages for a module: make snapshot-pages MODULE=linkedin"
	@echo "  make snapshot      - Capture snapshots: make snapshot MODULE=linkedin [PAGE=jobs]"
	@echo "  make test-selectors - Test selectors: make test-selectors MODULE=linkedin [PAGE=jobs]"
	@echo "  make ollama-ui     - Start Ollama WebUI for debugging (requires Docker)"
	@echo "  make stop-ui       - Stop Ollama WebUI"
	@echo "  make clean         - Remove build artifacts"

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

snapshot-list:
	npm run snapshot -- --list

snapshot-pages:
	@if [ -z "$(MODULE)" ]; then \
		echo "Error: MODULE required. Usage: make snapshot-pages MODULE=linkedin"; \
		exit 1; \
	fi
	npm run snapshot -- --pages $(MODULE)

snapshot:
	@if [ -z "$(MODULE)" ]; then \
		echo "Error: MODULE required. Usage: make snapshot MODULE=linkedin [PAGE=jobs]"; \
		exit 1; \
	fi
	@if [ -z "$(PAGE)" ]; then \
		npm run snapshot $(MODULE); \
	else \
		npm run snapshot $(MODULE) $(PAGE); \
	fi

test-selectors:
	@if [ -z "$(MODULE)" ]; then \
		npm run test-selectors -- --list; \
	elif [ -z "$(PAGE)" ]; then \
		npm run test-selectors $(MODULE); \
	else \
		npm run test-selectors $(MODULE) $(PAGE); \
	fi

clean:
	rm -rf dist node_modules
	npm install
