run_tests:
	python3 -m unittest discover tests -p '*_test.py'
	coverage run --source=src -m unittest discover tests -p '*_test.py'
	coverage report -m

.PHONY: up down logs-orchestrator doctor orchestrator-dev activate-richdocuments occ

up:
	@# Determine compose command (docker compose preferred, fallback to docker-compose)
	@if command -v docker >/dev/null 2>&1; then \
	  COMPOSE="docker compose"; \
	elif command -v docker-compose >/dev/null 2>&1; then \
	  COMPOSE="docker-compose"; \
	else \
	  echo "\n[make up] Docker CLI not found."; \
	  echo "- Install Docker Desktop for Mac: https://www.docker.com/products/docker-desktop/"; \
	  echo "- Or (Homebrew) use Colima: brew install colima docker docker-compose && colima start && docker context use colima"; \
	  echo "Then re-run: make up"; \
	  exit 1; \
	fi; \
	if [ ! -f .env ] && [ -z "$$OPENAI_API_KEY" ]; then \
	  echo "[make up] Warning: .env not found and OPENAI_API_KEY is not set. ai_orchestrator may fail without an API key."; \
	fi; \
	$$COMPOSE up -d --build

down:
	@if command -v docker >/dev/null 2>&1; then \
	  COMPOSE="docker compose"; \
	elif command -v docker-compose >/dev/null 2>&1; then \
	  COMPOSE="docker-compose"; \
	else \
	  echo "[make down] Docker CLI not found."; exit 1; \
	fi; \
	$$COMPOSE down

logs-orchestrator:
	@if command -v docker >/dev/null 2>&1; then \
	  COMPOSE="docker compose"; \
	elif command -v docker-compose >/dev/null 2>&1; then \
	  COMPOSE="docker-compose"; \
	else \
	  echo "[make logs-orchestrator] Docker CLI not found."; exit 1; \
	fi; \
	$$COMPOSE logs -f ai_orchestrator

# Quick environment diagnostics
doctor:
	@echo "[doctor] Checking prerequisites...";
	@echo "- docker: $$(if command -v docker >/dev/null 2>&1; then docker --version; else echo missing; fi)";
	@echo "- docker-compose: $$(if command -v docker-compose >/dev/null 2>&1; then docker-compose --version; else echo "missing (ok if 'docker compose' exists)"; fi)";
	@echo "- node: $$(if command -v node >/dev/null 2>&1; then node -v; else echo missing; fi)";
	@echo "- npm: $$(if command -v npm >/dev/null 2>&1; then npm -v; else echo missing; fi)";
	@echo "- .env: $$(if [ -f .env ]; then echo present; else echo missing; fi)";
	@echo "- OPENAI_API_KEY env: $$(if [ -n "$$OPENAI_API_KEY" ]; then echo set; else echo not\ set; fi)";
	@echo "[doctor] If docker is missing, install Docker Desktop or use Homebrew + Colima: brew install colima docker docker-compose && colima start && docker context use colima";

# Run the orchestrator service locally without Docker (useful while Docker is being set up)
orchestrator-dev:
	@echo "[orchestrator-dev] Starting ai-orchestrator locally on PORT=3101...";
	@cd services/ai-orchestrator && \
	  if [ ! -d node_modules ]; then echo "Installing deps..."; npm install; fi && \
	  PORT=$${PORT:-3101} npm run dev

# Helper: run richdocuments activation to populate WOPI discovery and validate connectivity
activate-richdocuments:
	@echo "[activate-richdocuments] Running richdocuments:activate-config in Nextcloud container...";
	@if command -v docker >/dev/null 2>&1; then \
	  COMPOSE="docker compose"; \
	elif command -v docker-compose >/dev/null 2>&1; then \
	  COMPOSE="docker-compose"; \
	else \
	  echo "[activate-richdocuments] Docker CLI not found."; \
	  echo "- Start Docker Desktop (macOS) or install via Homebrew + Colima:"; \
	  echo "    brew install colima docker docker-compose && colima start && docker context use colima"; \
	  exit 1; \
	fi; \
	if ! $$COMPOSE ps --services >/dev/null 2>&1; then \
	  echo "[activate-richdocuments] docker compose not ready or no project detected. Run 'make up' first."; \
	  exit 1; \
	fi; \
	if ! $$COMPOSE ps --services | grep -q "^nextcloud$$"; then \
	  echo "[activate-richdocuments] Nextcloud service is not up. Bringing stack up..."; \
	  $$COMPOSE up -d nextcloud; \
	  echo "[activate-richdocuments] Waiting 10s for Nextcloud to boot..."; \
	  sleep 10; \
	fi; \
	if $$COMPOSE exec nextcloud php occ status 2>&1 | grep -q "not installed"; then \
	  echo "[activate-richdocuments] Nextcloud is not installed yet."; \
	  echo "- Open http://localhost:8081 and complete the installation wizard"; \
	  echo "- Then install the richdocuments app: make occ ARGS='app:install richdocuments'"; \
	  echo "- Finally re-run: make activate-richdocuments"; \
	  exit 1; \
	fi; \
	if ! $$COMPOSE exec nextcloud php occ app:list | grep -q richdocuments; then \
	  echo "[activate-richdocuments] Installing richdocuments app..."; \
	  $$COMPOSE exec nextcloud php occ app:install richdocuments; \
	fi; \
	$$COMPOSE exec -u www-data nextcloud php occ richdocuments:activate-config --wopi-url http://collabora_online:9980 --callback-url http://localhost:8081 || { \
	  echo "[activate-richdocuments] Activation failed. Check Nextcloud logs with: $$COMPOSE logs -f nextcloud"; \
	  exit 1; \
	}; \
	echo "[activate-richdocuments] Setting public WOPI URL to localhost:9980..."; \
	$$COMPOSE exec nextcloud php occ config:app:set richdocuments public_wopi_url --value='http://localhost:9980' || true; \
	echo "[activate-richdocuments] Configuration complete!"

# Helper: run arbitrary OCC commands inside the Nextcloud container
# Usage: make occ ARGS="config:app:get richdocuments wopi_url"
occ:
	@echo "[occ] Executing: php occ $(ARGS)";
	@if command -v docker >/dev/null 2>&1; then \
	  COMPOSE="docker compose"; \
	elif command -v docker-compose >/dev/null 2>&1; then \
	  COMPOSE="docker-compose"; \
	else \
	  echo "[occ] Docker CLI not found."; exit 1; \
	fi; \
	if ! $$COMPOSE ps --services >/dev/null 2>&1; then \
	  echo "[occ] docker compose not ready or no project detected. Run 'make up' first."; \
	  exit 1; \
	fi; \
	$$COMPOSE exec -u www-data nextcloud php occ $(ARGS)
