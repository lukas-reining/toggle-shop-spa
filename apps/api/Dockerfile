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

# Copy sources needed to build shared + api.
COPY packages/shared packages/shared
COPY apps/api apps/api

RUN npm run build --workspace @toggle-shop/shared \
 && npm run build --workspace @toggle-shop/api

# Prune dev dependencies for the runtime image.
RUN npm prune --omit=dev

# ---- Runtime stage ----
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /repo

# Non-root user
RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -S nestjs

COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/package.json ./package.json
COPY --from=builder /repo/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /repo/packages/shared/dist ./packages/shared/dist
COPY --from=builder /repo/apps/api/package.json ./apps/api/package.json
COPY --from=builder /repo/apps/api/dist ./apps/api/dist

USER nestjs

ENV PORT=3001
EXPOSE 3001

CMD ["node", "apps/api/dist/main.js"]
