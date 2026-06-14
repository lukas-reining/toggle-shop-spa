# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /repo

# Install workspace dependencies using the lockfile.
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

# Copy sources needed to build shared + web.
COPY packages/shared packages/shared
COPY apps/web apps/web

RUN npm run build --workspace @toggle-shop/shared \
 && npm run build --workspace @toggle-shop/web

# ---- Runtime stage ----
# Nginx-based SPA server with runtime config + CSP handling.
FROM codecentric/single-page-application-server:1

# The built SPA assets are served from /app.
COPY --from=builder /repo/apps/web/dist /app

# Default runtime configuration (endpoints exposed via window.spaConfig).
# Can be overridden at runtime by mounting /config/config.yaml.
COPY apps/web/config/default.yaml /config/default.yaml
