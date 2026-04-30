FROM node:22-alpine AS builder
WORKDIR /app

# API_URL is baked into the bundle for axios's baseURL.
# APP_VERSION / BUILD_DATE stamp the About dialog so a deploy can be
# verified at a glance. They are passed in by the GHA workflow; in local
# dev quasar.config.js falls back to live `git` invocations.
ARG API_URL=""
ARG APP_VERSION=""
ARG BUILD_DATE=""
ENV API_URL=$API_URL
ENV APP_VERSION=$APP_VERSION
ENV BUILD_DATE=$BUILD_DATE

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:web

FROM nginx:1.25-alpine
COPY --from=builder /app/dist/pwa /usr/share/nginx/html
COPY nginx/spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
