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
# Stamp .app-version.json with the git short SHA + commit date so the About
# dialog can show what's deployed. Three sources, in priority order:
#   1. .git/ in the build context (dev host or git clone deploys)
#   2. .git_archival.txt with substituted $Format$ placeholders
#      (deploys that go through `git archive` — e.g. Portainer in some configs)
#   3. fallback to "unknown" + now() so the build never breaks over this
RUN set -e; \
    if [ -d .git ]; then \
      SHA="$(git rev-parse --short HEAD)"; \
      DATE="$(git log -1 --format=%cI)"; \
      SOURCE=".git"; \
    elif [ -f .git_archival.txt ] && ! grep -q '\$Format' .git_archival.txt; then \
      FULL_SHA="$(awk '/^node:/ {print $2}' .git_archival.txt)"; \
      SHA="$(printf '%s' "$FULL_SHA" | cut -c1-7)"; \
      DATE="$(awk '/^node-date:/ {print $2}' .git_archival.txt)"; \
      SOURCE=".git_archival.txt"; \
    else \
      SHA="unknown"; \
      DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)"; \
      SOURCE="fallback"; \
      echo "WARNING: no .git directory and .git_archival.txt has unsubstituted placeholders — version will display as 'unknown'."; \
    fi; \
    printf '{"version":"%s","date":"%s"}\n' "$SHA" "$DATE" > .app-version.json; \
    echo "Stamped build (source: $SOURCE): $SHA @ $DATE"; \
    cat .app-version.json
# Build the Quasar SPA (configured for Vue 3 + PWA in quasar.config.js)
RUN npm run build:web

FROM nginx:1.25-alpine
COPY --from=builder /app/dist/pwa /usr/share/nginx/html
COPY nginx/spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
