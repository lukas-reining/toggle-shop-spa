.PHONY: help generate-flags check-openfeature-cli start-flagd dev

.DEFAULT_GOAL := help

help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Dev:"
	@echo "  start-flagd       Start standalone flagd serving flags.json over OFREP (Docker, port 8013)"
	@echo "  dev               Start api + web (instructions)"
	@echo ""
	@echo "Other:"
	@echo "  generate-flags    Generate OpenFeature React/Node hooks from flags.json"

generate-flags: check-openfeature-cli
	openfeature generate react
	openfeature generate nodejs
	@echo "Flags generated."

check-openfeature-cli:
	@if ! command -v openfeature >/dev/null 2>&1; then \
		echo "Error: OpenFeature CLI not available"; \
		echo "Please install OpenFeature CLI: https://github.com/open-feature/cli#installation"; \
		exit 1; \
	fi

# Standalone flagd serving the local flags.json.
# - OFREP endpoint (used by the web SPA client provider): http://localhost:8016
# - gRPC sync (used by the api in-process provider):       localhost:8015
start-flagd:
	docker run --rm -it \
	  -p 8013:8013 -p 8015:8015 -p 8016:8016 \
	  -v $(PWD)/flags.json:/etc/flagd/flags.json \
	  ghcr.io/open-feature/flagd:latest start \
	  --uri file:/etc/flagd/flags.json \
	  --cors-origin 'http://localhost:3000'

dev:
	@echo "Start each service in a separate terminal:"
	@echo "  make start-flagd"
	@echo "  npm run dev:api"
	@echo "  npm run dev:web"
