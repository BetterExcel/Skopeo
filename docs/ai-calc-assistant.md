# AI Calc Assistant — System Documentation

## Overview

The AI Calc Assistant integrates an AI-powered sidebar into Nextcloud’s Collabora Online Calc to execute spreadsheet tasks via natural language. It consists of:
- A Nextcloud app (Vue) that renders the sidebar, talks to the orchestrator, and executes actions via a UNO postMessage bridge.
- An AI orchestrator (Node/Express) that calls OpenAI Responses API with function tools and streams plans using SSE.
- A UNO bridge that maps tool calls to Collabora UNO commands.

## Architecture

High-level components
- Nextcloud app: `apps/ai-calc-assistant` (UI, preview/confirm, execution, toasts, diagnostics)
- Orchestrator service: `services/ai-orchestrator` (plan generation, streaming, validation, rate limit)
- Collabora Online (in `src/view/` dockerized) driven by UNO via postMessage from the sidebar

Data flow
1. User prompt → Sidebar
2. Sidebar → Orchestrator: POST /api/plan
3. Orchestrator → Sidebar: GET /api/stream/:planId (SSE) with planning tokens/events
4. Sidebar preview/confirm
5. Sidebar → UNO bridge: Execute tool calls via postMessage → Collabora

## Setup

Prerequisites
- Docker + docker-compose
- Node.js (npm included). On macOS, run the bootstrap script if needed.

Bootstrap (macOS only)
```zsh
./scripts/macos-bootstrap.sh
# Then open a new terminal or:
source ~/.zprofile
```

Project environment
```zsh
# One-time Python deps (optional)
./scripts/setup.sh

# Bring up services
docker-compose up -d
```

Nextcloud + Collabora integration
- Navigate to Nextcloud (e.g., http://<your_ip>:8081), install Nextcloud Office
- Administration → Office → “Use your own server” → http://<your_ip>:9980 and Save
- Ensure your IP is added to Nextcloud’s `trusted_domains` (see repo README for steps)

Build the Nextcloud app UI (optional during dev)
```zsh
cd apps/ai-calc-assistant
npm install
npm run build
```

Orchestrator config
- Environment: set `OPENAI_API_KEY` for the service (e.g., via docker-compose env or `.env`)
- Health: GET `/health` returns `{ status: "ok" }`

WOPI / Richdocuments extension
- Ensure Richdocuments’ CheckFileInfo includes:
  - `EnableRemoteAIContent: true` for Calc docs
  - `PostMessageOrigin` matching the Nextcloud origin
- See: `apps/ai-calc-assistant/docs/richdocuments-checkfileinfo-patch.md` and `apps/ai-calc-assistant/scripts/apply-richdocs-6.1.sh`

## UNO command mappings and tools

Core UNO constants (see `apps/ai-calc-assistant/src/agent/types.ts`):
- `.uno:GoToCell` (navigate/select)
- `.uno:EnterString` (set value/formula)
- `.uno:DataSort` (sort)
- `.uno:InsertObjectChart` (chart)
- `.uno:DataPilotInsert` (pivot)
- `.uno:Bold` (bold)
- `.uno:NumberFormatCurrency` (currency)
- `.uno:Undo`, `.uno:Redo` (history)

Tool implementations (see `apps/ai-calc-assistant/src/agent/tools.ts`):
- `go_to_cell(address)` → GoToCell
- `set_cell_text(address, text)` → GoToCell + EnterString
- `apply_formula(address, formula)` → GoToCell + EnterString
- Formatting: `format_range_bold(range)`, `format_range_currency(range)`
- Sorting: `sort_range(range, column, ascending)` → DataSort
- Advanced: `create_pivot(range)` → DataPilotInsert; `create_chart(range, type)` → InsertObjectChart
- History: `undo()`, `redo()`
- Helpers: `get_selection()`, `select_range(range)`

Validation and safety (see `validators.ts`)
- Address/range bounds and order validation
- Formula must start with `=`; safe text/formula length guards
- Sanitization for tool args to reduce risks

## Orchestrator API

Base URL: service address (see docker-compose or env PORT)

- GET `/health`
  - 200: `{ status: "ok", service: "ai-orchestrator" }`

- POST `/api/plan`
  - Body:
    ```json
    {
      "userPrompt": "Put \"hello\" in A1",
      "sheetContext": {
        "currentSheet": "Sheet1",
        "selection": { "range": "A1", "type": "cell"},
        "namedRanges": ["Data"],
        "sheetNames": ["Sheet1"],
        "documentType": "calc"
      }
    }
    ```
  - 202: `{ "planId": "<uuid>" }`
  - 400: `{ error: "invalid_request" }` (Zod validation)
  - Rate limiting: 429 with `Retry-After` header

- GET `/api/stream/:planId`
  - SSE stream of planning events from OpenAI Responses API
  - 404 if unknown planId; 409 if already consumed; 500 on stream error

## Troubleshooting

- npm or brew not found on macOS
  - Run `./scripts/macos-bootstrap.sh`, then `source ~/.zprofile`
- Sidebar doesn’t load in Calc
  - Confirm Nextcloud Office is configured to Collabora URL and you’re opening a Calc doc
- Cross-origin or Collabora not ready
  - Check `PostMessageOrigin` in CheckFileInfo matches window.location.origin
  - Sidebar diagnostics panel shows mismatches and orchestrator health
- Orchestrator “OPENAI_API_KEY is not configured”
  - Set env `OPENAI_API_KEY` for the service; confirm via `/health` and server logs
- SSE not streaming
  - Check reverse proxy buffering; ensure the connection remains open; look for errors in orchestrator logs
- Rate limited (429)
  - Reduce request frequency or widen RATE_LIMIT_* envs

## Testing

Unit tests (app)
```zsh
cd apps/ai-calc-assistant
npm run test
```

E2E tests (Playwright)
```zsh
cd apps/ai-calc-assistant
E2E_BASE_URL="http://<nextcloud>/path-to-calc" npm run test:e2e
```

Integration tests (orchestrator)
```zsh
cd services/ai-orchestrator
npm install
npm test
```

## Security notes
- PostMessage origin is validated in the UNO bridge
- Minimal data sent to OpenAI (tool definitions with user prompt; avoid raw cell dumps)
- Input validated for bounds and syntax; orchestrator uses simple rate limiting

---
If you run into setup issues, start with the bootstrap + README steps, verify `/health`, and check the sidebar diagnostics.
