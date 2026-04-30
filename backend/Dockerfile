FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/tsconfig.json ./
COPY backend/prisma ./prisma
RUN npx prisma generate
# Frontend blueprints — extractBlueprints.ts imports from ../../src/scripts/...
COPY src/scripts/databaseManager/blueprints /src/scripts/databaseManager/blueprints
COPY backend/scripts ./scripts
COPY backend/src ./src
RUN npm run build

FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
# APP_VERSION / BUILD_DATE are surfaced by GET /api/version. Passed in by
# the GHA workflow via --build-arg; default to "unknown" so the build
# never fails when invoked outside CI (e.g. local docker compose build).
ARG APP_VERSION="unknown"
ARG BUILD_DATE=""
ENV APP_VERSION=$APP_VERSION
ENV BUILD_DATE=$BUILD_DATE
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY backend/package.json ./
RUN mkdir -p /app/uploads
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O- http://127.0.0.1:3000/health || exit 1
CMD sh -c "npx prisma migrate deploy && node dist/index.js"
