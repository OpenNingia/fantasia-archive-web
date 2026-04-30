FROM node:20-alpine AS builder
WORKDIR /app
ARG API_URL=""
ENV API_URL=$API_URL
COPY package*.json ./
RUN npm ci
COPY . .
# Build the Quasar SPA (configured for Vue 3 + PWA in quasar.config.js)
RUN npm run build:web

FROM nginx:1.25-alpine
COPY --from=builder /app/dist/spa /usr/share/nginx/html
COPY nginx/spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
