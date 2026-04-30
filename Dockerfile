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
# Build the Quasar SPA (configured for Vue 3 + PWA in quasar.config.js)
RUN npm run build:web

FROM nginx:1.25-alpine
COPY --from=builder /app/dist/pwa /usr/share/nginx/html
COPY nginx/spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
