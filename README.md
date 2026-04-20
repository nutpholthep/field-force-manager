# iCrewForce — Field Force Manager

Two independent apps under `apps/`:

- **`apps/web`** — Next.js 16 (App Router) frontend
- **`apps/api`** — NestJS 10 + Prisma 5 (PostgreSQL) backend with JWT auth

Each app has its own `package.json`, `node_modules`, and lockfile. **No workspace tooling required.**

---

## Tech Stack

| Layer       | Technology                                                          |
| ----------- | ------------------------------------------------------------------- |
| Frontend    | Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui        |
| Data layer  | `@tanstack/react-query`, Axios (with JWT refresh)                   |
| Backend     | NestJS 10, TypeScript, class-validator, Swagger                     |
| ORM         | Prisma 5                                                            |
| Database    | PostgreSQL 14+                                                      |
| Auth        | JWT access + refresh, bcrypt-hashed passwords                       |
| Shared code | `apps/web/src/shared` — types + Zod schemas (inlined into the app)  |
| Pkg mgr     | yarn (each app installed standalone)                                |

---

## Project Layout

```
field-force-manager/
├── apps/
│   ├── api/                  # NestJS + Prisma  (own package.json, own node_modules)
│   │   ├── Dockerfile
│   │   ├── .dockerignore
│   │   └── prisma/
│   └── web/                  # Next.js 16        (own package.json, own node_modules)
│       ├── Dockerfile
│       ├── .dockerignore
│       └── src/shared/       # Inlined shared types + Zod schemas
├── docker-compose.yml        # postgres + api + web
├── .env.example              # Compose overrides (JWT_SECRET, …)
└── package.json              # Convenience root scripts (delegate via yarn --cwd)
```

> The legacy Vite/Base44 export under `src/` and `base44/` at the repo root is unrelated to the active apps and can be removed when no longer needed.

---

## Prerequisites

Pick one path:

- **Local dev**: Node.js 20+, yarn 1.22+ (`npm i -g yarn`), and a PostgreSQL 14+ instance
- **Docker only**: Docker Desktop 24+ (no Node/yarn needed on the host)

---

## Quick Start — Docker (recommended for testing)

```powershell
# Optional: copy compose env overrides
Copy-Item .env.example .env

# Build + start postgres + api + web
docker compose up --build

# Tail logs only
docker compose logs -f
```

Open:
- Web: http://localhost:3000
- API: http://localhost:3001/api
- Swagger: http://localhost:3001/api/docs

The `api` service automatically runs `prisma migrate deploy` and seeds the database (idempotent) on every start.

Stop & clean:
```powershell
docker compose down            # stop containers
docker compose down -v         # …and wipe the postgres volume
```

Default seeded admin (`apps/api/prisma/seed.ts`):
```
email:    admin@ffm.local
password: admin123
```

---

## Quick Start — Local (yarn per app)

```powershell
# 1) API
cd apps/api
Copy-Item .env.example .env
# edit .env → DATABASE_URL pointing to your local Postgres
yarn install
yarn prisma:generate
yarn prisma:migrate    # creates schema + applies migrations
yarn prisma:seed       # admin + master data
yarn dev               # http://localhost:3001/api

# 2) Web (in another terminal)
cd apps/web
Copy-Item .env.example .env.local
yarn install
yarn dev               # http://localhost:3000
```

---

## Convenience Root Scripts (optional)

The root `package.json` only contains thin wrappers around `yarn --cwd apps/<app>`:

```powershell
yarn install:all         # install both apps
yarn dev:api             # → apps/api
yarn dev:web             # → apps/web
yarn build:api
yarn build:web
yarn typecheck           # both
yarn lint                # both

# Database
yarn db:migrate          # prisma migrate dev (in apps/api)
yarn db:seed
yarn db:studio

# Docker
yarn docker:up           # docker compose up --build
yarn docker:down
yarn docker:logs
```

---

## Environment Variables

### `apps/api/.env` (template at `apps/api/.env.example`)

```
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ffm?schema=public
JWT_SECRET=...
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=...
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

### `apps/web/.env.local` (template at `apps/web/.env.example`)

```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=Field Force Manager
```

### `.env` at repo root (used by `docker compose`, see `.env.example`)

Overrides for `docker-compose.yml` — `JWT_SECRET`, `CORS_ORIGIN`, `NEXT_PUBLIC_API_URL`, etc.

---

## Authentication Flow

1. `POST /api/auth/login` → `{ user, tokens: { access_token, refresh_token, expires_in } }`
2. Access token stored in `localStorage` (`apps/web/src/lib/token-storage.ts`); attached to every request via Axios interceptor.
3. On `401`, the interceptor transparently calls `POST /api/auth/refresh`.
4. `GET /api/auth/me` bootstraps the session on first page load.

Routes inside the `(app)` group are protected client-side by `apps/web/src/app/(app)/layout.tsx`.

---

## API — Entity CRUD

Each entity is exposed as `GET / GET :id / POST / PATCH :id / DELETE :id` under its route. Highlights:

| Entity               | Route                    |
| -------------------- | ------------------------ |
| Customer             | `/api/customers`         |
| Site                 | `/api/sites`             |
| Zone                 | `/api/zones`             |
| Project              | `/api/projects`          |
| Skill                | `/api/skills`            |
| PriorityMaster       | `/api/priorities`        |
| StuckReason          | `/api/stuck-reasons`     |
| MaterialCategory     | `/api/material-categories` |
| Material             | `/api/materials`         |
| ServiceType          | `/api/service-types`     |
| Workflow             | `/api/workflows`         |
| Team / TeamRole      | `/api/teams`, `/api/team-roles` |
| Technician           | `/api/technicians`       |
| WorkOrder            | `/api/work-orders`       |
| Notification         | `/api/notifications`     |
| AIAgent              | `/api/agents`            |
| User                 | `/api/users`             |

---

## Notes on the @ffm/shared move

The previous `packages/shared` workspace package is now inlined into `apps/web/src/shared`. Imports such as

```ts
import type { Technician } from '@ffm/shared';
```

still resolve via the `@ffm/shared` → `./src/shared` path mapping in `apps/web/tsconfig.json` — no source changes were needed.

The api app does not import `@ffm/shared`, so its dependency was simply removed.

---

## Known Cleanup Items

- Pre-existing TypeScript errors in `apps/web/src/components/{agents,team,workorders,projects}` and a few `app/(app)/*/page.tsx` files. To unblock `next build` inside Docker, `next.config.ts` currently sets `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true`. Flip both back to `false` after fixing the underlying types (run `yarn typecheck` inside `apps/web`).
- The legacy `src/`, `base44/`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `eslint.config.js`, `components.json`, `jsconfig.json`, and `index.html` at the repo root are remnants of the original Base44 Vite app and are not used by the new apps.

---

## License

Proprietary — internal use only.
