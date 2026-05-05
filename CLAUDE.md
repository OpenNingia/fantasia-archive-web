# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

Fantasia Archive is a self-hosted, multi-user database manager for world-building. It is a fork of the original Electron desktop app, re-architected as a web application: a Vue 3 + Quasar PWA frontend and a Fastify + Prisma + PostgreSQL backend. It runs as Docker Compose services behind Traefik, but the frontend dev server runs on the host via `quasar dev` while Postgres/Redis/backend run in containers.

The port from Electron/PouchDB → web is largely complete (Phases 0–7+9). Remaining work tracked in `BUGS.md` and the auto-memory project status file: Phase 10 (PouchDB → Postgres migration tool) and Phase 11 (remove the keybinds subsystem). PouchDB still appears in `package.json` and `quasar.config.js` aliases — it is **legacy**, only used in the old `ExportProject.vue`-style code path. New work should go through the Fastify API, not PouchDB.

## Common commands

### Frontend (repo root)

```bash
npm install
npm run dev              # quasar dev -m pwa  → http://localhost:9000 (proxies /api, /auth, /files to :3000)
npm run build            # quasar build -m pwa
npm run lint             # eslint --ext .js,.ts,.vue ./
npm run test:e2e         # Playwright headless
npm run test:e2e:ui      # Playwright UI mode
npx playwright test tests/e2e/documents.spec.ts                        # one file
npx playwright test tests/e2e/documents.spec.ts -g "creates a document"  # one test by title
```

`fullyParallel: false` in `playwright.config.ts` — E2E tests run sequentially against a shared backend.

### Backend (`backend/`)

```bash
cd backend
npm install
npm run dev                  # tsx watch src/index.ts (predev extracts blueprints first)
npm run build                # tsc → dist/, copies blueprints.json
npm start                    # node dist/index.js (production)
npm test                     # vitest run
npx vitest run path/to/file.test.ts   # single test file
npm run db:migrate:dev       # prisma migrate dev (development)
npm run db:migrate           # prisma migrate deploy (production)
npm run db:generate          # regenerate Prisma client
npm run db:studio            # Prisma Studio at :5555
```

### Dev stack (containers + host frontend)

```bash
cp .env.example .env                                   # set passwords, LOCAL_AUTH_ENABLED=true for local dev
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
docker compose exec backend npm run db:migrate:dev
npm run dev                                            # frontend on host
./scripts/register-user.sh user@example.com pass1234 "User"   # seed first local-auth user
```

Backend on `:3000`, Postgres on `:5432`, Redis on `:6379`. The frontend dev server proxies `/api`, `/auth`, `/files` to the backend.

### Production stack

`docker-compose.yml` builds the frontend image locally; `docker-compose.prod.yml` is what Portainer pulls — the frontend image is pushed to `ghcr.io` by `.github/workflows/docker-publish.yml`. Backend is built locally in both. After bring-up, run `docker compose exec backend npm run db:migrate`.

## Architecture

### Big picture

```
browser ──▶ nginx (frontend SPA, PWA) ──▶ /api/, /auth/, /files/ ──▶ Fastify ──▶ Postgres
                                                                          └─▶ Redis (sessions, refresh, rate limit)
```

Auth is JWT-in-HttpOnly-cookie (`fa_token`). The `authPlugin` (`backend/src/plugins/auth.ts`) decodes it on every request via a `preHandler` hook and attaches `req.user`. `requireAuth` / `requireProjectAccess` / `requireMaster` middleware gate routes. The frontend `axios` client (`src/services/api/client.ts`) sends `withCredentials: true` and redirects to `/login` on any 401.

Two auth modes coexist:
- **OIDC** (`backend/src/plugins/oidc.ts`) — Authentik or any OIDC provider. Redirect URI is `${BACKEND_URL}/auth/callback`.
- **Local auth** (`/auth/local/{register,login}`) — gated by `LOCAL_AUTH_ENABLED=true`. Used for dev, e2e, and air-gapped setups. When enabled, the rate limiter is bumped from 200 → 5000 req/min in `backend/src/index.ts` because parallel test runners burst.

### Data model (Prisma, `backend/prisma/schema.prisma`)

- `Project` is the top-level scope. `ProjectAccess` joins users to projects with role `'master' | 'player'`.
- `Blueprint` is a per-project document type definition (e.g. `characters`, `locations`). `extraFields` is `Json` — array of `I_ExtraFields` from the frontend interface, each may have `masterOnly: boolean`.
- `Document` belongs to a project and has a `type` (= blueprint slug). Its `extraFields` is `Json` — array of `{id, value, type?}`. Documents form a tree via `parentDocId` (`DocHierarchy` self-relation).
- Relationship fields are stored inside `Document.extraFields`. `documentService` walks them and maintains paired back-references on the related document — see `RELATIONSHIP_FIELD_TYPES` and `getRelationshipTargets` in `backend/src/services/documentService.ts`. **All document writes must go through this service** so paired fields stay consistent.
- `masterOnlyFilter` strips master-only fields from API responses for player-role users — applies to both blueprints and documents.

### Blueprints: shared between frontend and backend

Blueprint definitions live in `src/scripts/databaseManager/blueprints/*.ts` (frontend, pure TS data — no runtime deps). The backend's pre-build step `backend/scripts/extractBlueprints.ts` imports them and writes `backend/src/data/blueprints.json`. Runs automatically via `predev` / `prebuild`. **When adding a new built-in document type:**

1. Add a `<type>.ts` file under `src/scripts/databaseManager/blueprints/`, exporting a constant matching `I_Blueprint` (`src/interfaces/I_Blueprint.ts`).
2. Add an entry to the `FILES` array in `backend/scripts/extractBlueprints.ts`.
3. Restart the backend (predev re-extracts).
4. Existing projects need re-seeding — `seedBlueprintsForProject` only runs on project creation.

### Frontend structure

- **Routing** (`src/router/routes.ts`) — three top-level paths: `/login`, `/` (welcome/project list), `/project/:projectId` (with nested `/display-content/:type/:id`). Project/document state is encoded in the URL, not localStorage (see auto-memory feedback note).
- **State** — Pinia stores under `src/stores/`. `project` holds the current project, user, role; `allDocuments` and `openedDocuments` cache loaded docs; `blueprints` caches blueprints per project; `dialogs`, `floatingWindows`, `options`, `keybinds` are UI state.
- **API layer** — `src/services/api/*.ts`, all going through the shared `client.ts` axios instance. One file per resource (`projectApi`, `documentApi`, `blueprintApi`, etc.).
- **Boot files** (`src/boot/`) — Quasar boot scripts wired in `quasar.config.js`. `auth.ts` checks the session and redirects; `axios.ts` configures the client; `pinia.ts` installs the store.
- **PWA** — `src-pwa/custom-service-worker.ts`. `quasar.config.js` configures runtime caching to `NetworkOnly` for `/api/` and `/auth/` so API calls never hit a stale cache.

### Build-time injection

`__APP_VERSION__` and `__BUILD_DATE__` are baked in by `quasar.config.js` from `process.env` (set by GHA via Docker `--build-arg`) or live `git` calls during local builds. They're surfaced through `versionApi`. Don't read `git` at runtime in the frontend.

### PouchDB legacy aliases

`quasar.config.js` aliases `pouchdb` → `pouchdb-browser` and stubs out `fs-extra` and `request` via `src/shims/node-stub.ts`. These are bridges for not-yet-ported code. New code should not import them.

## Conventions

- **Conventional Commits** — adopted 2026-04-30. New commits use `feat:` / `fix:` / `chore:` etc. Older history is mixed; don't rewrite it.
- **URL-state over localStorage** — for state that must survive F5 (selected project, opened document), encode it in the route, not localStorage. See `src/router/routes.ts`.
- **Quasar v2** — q-components use Vue 3 conventions (`:rows`, `v-model:pagination`, etc.). Some legacy code still has Quasar-v1-style props; treat that as a bug, not a pattern (e.g. `BUGS.md` keybinds entry).
- **Indentation** — 2 spaces, no semicolons, double quotes (`.eslintrc.js`).

## Environment variables

See `.env.example` for the full list. Required: `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `JWT_SECRET` (≥ 32 chars), `FRONTEND_HOST`/`_URL`, `BACKEND_HOST`/`_URL`. Either configure `OIDC_*` or set `LOCAL_AUTH_ENABLED=true`.
