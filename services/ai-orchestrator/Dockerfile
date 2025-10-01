# syntax=docker/dockerfile:1.7-labs
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* .npmrc* ./
RUN --mount=type=cache,target=/root/.npm \
        if [ -f package-lock.json ]; then \
            npm ci --omit=optional; \
        else \
            echo "[docker] package-lock.json not found; using 'npm install'"; \
            npm install --omit=optional; \
        fi

FROM deps AS build
COPY tsconfig.json ./
COPY src ./src
RUN --mount=type=cache,target=/root/.npm \
    npm run build

FROM node:20-alpine AS runtime
ENV NODE_ENV=production \
    PORT=3101
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./package.json
COPY --from=build /app/dist ./dist

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/health | grep '"status":"ok"' || exit 1

EXPOSE 3101
CMD ["node", "dist/index.js"]
