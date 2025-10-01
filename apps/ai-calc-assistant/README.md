AI Calc Assistant — Nextcloud App
=================================

Configuration (Task 6.2)
-------------------------

Server-side app config keys (via `occ config:app:set` or admin settings):

- ai-calc-assistant:orchestrator_url — URL of the AI orchestrator service (e.g. <https://orchestrator:3030>)
- ai-calc-assistant:post_message_origin — Nextcloud origin used for Collabora postMessage allowlist (optional, auto-derived)
- ai-calc-assistant:max_cells_without_confirmation — integer (default 1000)
- ai-calc-assistant:debug — true/false (default false)
- ai-calc-assistant:sse_reconnect_ms — integer (default 1500)
- ai-calc-assistant:sse_max_duration_ms — integer (default 180000)

Endpoints:

- GET /apps/ai-calc-assistant/api/health — returns `{ status: "ok" }`
- GET /apps/ai-calc-assistant/api/config — returns config + diagnostics (orchestrator reachability)

Notes:

- Ensure Richdocuments WOPI CheckFileInfo provides `EnableRemoteAIContent` and `PostMessageOrigin`.
- Behind reverse proxies, set Nextcloud’s `overwriteprotocol` and trusted proxies so auto-derived origin matches browser origin.
- Client-side validation: addresses/ranges bounds-checked, formulas must start with `=`, and text/formula length limits are enforced to reduce risks (Req. 7.2).

End-to-end tests (Task 8.2)
---------------------------

Initial Playwright scaffolding is included under `tests-e2e/` with configuration in `playwright.config.ts`.

Prerequisites:

- A running Nextcloud + Collabora (Richdocuments) dev instance with this app enabled.
- The sidebar must mount in a Calc document and the app’s `/api/config` endpoint should be reachable.
- Optionally set `E2E_BASE_URL` to the URL hosting the UI (default `http://localhost:8080`).

Run:

- `npm run test:e2e` for headless
- `npm run test:e2e:headed` for headed browser

Selectors:

- `#ai-calc-assistant-root` — Sidebar root container
- `[data-test="diagnostics-section"]` — Config and server diagnostics panels
- `[data-test="chat-input"]`, `[data-test="send-btn"]` — Chat composer
- `[data-test="progress-log"]` — Messages list used for progress assertions
- `[data-test="toast-<type>"]` — Toast notifications (success, error, info)

Deployment notes
----------------

- The Nextcloud app is delivered by Nextcloud; build assets with `npm run build` and deploy the app directory into Nextcloud’s `custom_apps` if packaging outside this repo.
- Ensure the orchestrator URL is configured via Nextcloud app config (`ai-calc-assistant:orchestrator_url`) and reachable from the browser.
