# AI Orchestrator (Task 2.1)

Express + TypeScript foundation with environment validation.

## Scripts

- `npm run dev` – start dev server with tsx (hot reload)
- `npm run build` – build to `dist/`
- `npm run lint` – lint sources
- `npm run format` – format sources

## Environment Variables

Create a `.env` in this folder or rely on root `.env`:

```env
PORT=3101
OPENAI_API_KEY=sk-...
NODE_ENV=development
```

## Health Check

GET <http://localhost:3101/health> → `{ "status": "ok", "service": "ai-orchestrator" }`
