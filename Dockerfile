FROM node:22-alpine AS builder
# git is needed at build time so quasar.config.js can stamp the bundle with
# the short SHA + commit date. The builder stage is discarded — the final
# nginx image stays slim.
RUN apk add --no-cache git
WORKDIR /app
ARG API_URL=""
ENV API_URL=$API_URL
COPY package*.json ./
RUN npm ci
COPY . .
# Stamp the build with the git short SHA + commit date. Done explicitly here
# so the values land in the build logs and an absent .git fails loudly
# instead of silently producing "unknown" in the About dialog.
RUN ls -la .git > /dev/null 2>&1 || (echo "ERROR: .git missing from build context — check .dockerignore and the deploy method (Portainer must do a git clone, not export a tarball)." && exit 1) \
 && SHA="$(git rev-parse --short HEAD)" \
 && DATE="$(git log -1 --format=%cI)" \
 && printf '{"version":"%s","date":"%s"}\n' "$SHA" "$DATE" > .app-version.json \
 && echo "Stamped build: $SHA @ $DATE" \
 && cat .app-version.json
# Build the Quasar SPA (configured for Vue 3 + PWA in quasar.config.js)
RUN npm run build:web

FROM nginx:1.25-alpine
COPY --from=builder /app/dist/pwa /usr/share/nginx/html
COPY nginx/spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
