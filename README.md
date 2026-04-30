# Fantasia Archive

A multi-user, self-hosted database manager for world building.

This repository is a fork of the original
[vishiri/fantasia-archive-v1](https://github.com/vishiri/fantasia-archive-v1)
Electron desktop app, re-architected as a self-hostable web application:
a Vue 3 + Quasar PWA frontend and a Fastify + Prisma + PostgreSQL backend,
packaged as Docker Compose services and designed to sit behind Traefik with
Let's Encrypt.

The port from Electron/PouchDB to the current web stack was carried out with
the assistance of [Claude Code](https://claude.com/claude-code).

## Features

- **Multi-user collaboration** — master / player roles with per-field ACL
  (master-only fields are hidden from players)
- **OIDC authentication** — works with Authentik or any OIDC-compliant provider;
  optional local username/password login for bootstrap or air-gapped setups
- **PWA** — installable, offline shell, runtime caching for static assets
- **Project backup / restore** — ZIP export and import from the UI
- **PostgreSQL storage** — replaces the old PouchDB/Electron persistence
- **Self-hosted** — all data stays on your infrastructure

## Architecture

```
┌──────────┐      ┌─────────────┐      ┌──────────────┐
│ Traefik  │ ───▶ │  frontend   │      │              │
│  (TLS)   │      │ (nginx+SPA) │      │  postgres    │
│          │      └─────────────┘      │              │
│          │                           │              │
│          │      ┌─────────────┐      └──────────────┘
│          │ ───▶ │  backend    │ ───▶ ┌──────────────┐
└──────────┘      │  (Fastify)  │      │   redis      │
                  └─────────────┘      └──────────────┘
```

Compose services:

| Service    | Image / build                | Purpose                                      |
| ---------- | ---------------------------- | -------------------------------------------- |
| `postgres` | `postgres:16-alpine`         | Primary data store                           |
| `redis`    | `redis:7-alpine`             | Sessions, refresh-token store, rate limiting |
| `backend`  | built from `backend/`        | Fastify API, Prisma, OIDC                    |
| `frontend` | built from repo root         | Quasar PWA served by nginx                   |

## Requirements

- Docker Engine 24+ and Docker Compose v2
- A domain (or two subdomains) pointed at your host, e.g. `fa.example.com` and
  `api.fa.example.com`
- An external `traefik_net` Docker network with a Traefik instance terminating
  TLS — or adapt the labels for your reverse proxy
- An OIDC provider (Authentik recommended) — or skip OIDC and use local auth

## Quick start (production)

1. Clone the repository:

   ```bash
   git clone https://github.com/<your-fork>/fantasia-archive-v1.git
   cd fantasia-archive-v1
   ```

2. Copy and edit the environment file:

   ```bash
   cp .env.example .env
   $EDITOR .env
   ```

   At minimum, set `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `JWT_SECRET` (≥ 32
   random chars), the four `*_HOST` / `*_URL` variables, and either configure
   OIDC or set `LOCAL_AUTH_ENABLED=true`.

3. Make sure the external `traefik_net` network exists:

   ```bash
   docker network create traefik_net   # only if you don't already have one
   ```

4. Build and start the stack:

   ```bash
   docker compose up -d --build
   ```

5. Run the database migrations on first boot:

   ```bash
   docker compose exec backend npm run db:migrate
   ```

The frontend is now reachable at `https://${FRONTEND_HOST}` and the API at
`https://${BACKEND_HOST}`.

## Configuration

All configuration is via environment variables in `.env`. See
[`.env.example`](.env.example) for the full list. Highlights:

| Variable                    | Purpose                                        |
| --------------------------- | ---------------------------------------------- |
| `POSTGRES_PASSWORD`         | PostgreSQL password                            |
| `REDIS_PASSWORD`            | Redis password                                 |
| `JWT_SECRET`                | Signing secret for access tokens (≥ 32 chars)  |
| `FRONTEND_HOST` / `_URL`    | Public hostname / URL of the SPA               |
| `BACKEND_HOST` / `_URL`     | Public hostname / URL of the API               |
| `OIDC_ISSUER_URL`           | OIDC discovery URL (leave blank to disable)    |
| `OIDC_CLIENT_ID` / `_SECRET`| OIDC credentials                               |
| `LOCAL_AUTH_ENABLED`        | `true` to enable `/auth/local/{register,login}`|
| `JWT_EXPIRY`                | Access token lifetime in seconds (default 900) |
| `REFRESH_TOKEN_EXPIRY_DAYS` | Refresh token lifetime in days (default 7)     |

### OIDC redirect URI

Register `${BACKEND_URL}/auth/callback` as an allowed redirect URI in your OIDC
provider.

### Bootstrapping the first user

With `LOCAL_AUTH_ENABLED=true`, the helper script
[`scripts/register-user.sh`](scripts/register-user.sh) registers a user against
the running backend. With OIDC only, the first user to log in is created
automatically; promote them to master via the database or admin UI.

## Development

The dev stack runs Postgres and Redis in containers, the backend in a container
with hot reload, and the frontend on the host with `quasar dev`.

```bash
cp .env.example .env                     # set passwords; LOCAL_AUTH_ENABLED=true
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
docker compose exec backend npm run db:migrate:dev

npm install
npm run dev                              # Quasar PWA on http://localhost:9000
```

The backend listens on `http://localhost:3000`. Postgres is exposed on `:5432`
and Redis on `:6379` for direct inspection.

### End-to-end tests

Playwright is configured at the repo root:

```bash
npm run test:e2e        # headless
npm run test:e2e:ui     # Playwright UI
```

### Backend unit tests

```bash
cd backend
npm test                # vitest
```

### Adding a new document type

Blueprints live in `src/databaseManager/blueprints`. Field configuration options
are documented in `I_Blueprint.ts`. The build extracts blueprints into JSON for
the backend (`backend/scripts/extractBlueprints.ts`).

## Backup and restore

From the project settings dialog (General tab), use **Backup project** to
download a ZIP of the project's data and **Restore project** to import one.
ZIPs include documents and their relationships in JSON form. Uploaded images
are stored under the `uploads` Docker volume — back that volume up alongside
the Postgres volume.

## Migrating from the Electron desktop app

A migration tool that reads existing PouchDB `.txt` exports and inserts them
into PostgreSQL is planned. Until then, restore your old project by hand or
keep the desktop app running in parallel.

## License

GNU GPL v3. See [`LICENSE.md`](LICENSE.md).
