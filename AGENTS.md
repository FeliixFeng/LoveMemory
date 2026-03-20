# AGENTS.md

Repo-specific operating guide for autonomous coding agents in **LoveMemory**.

## 1) Project overview
- Stack: `Next.js 15 + React 18 + TypeScript + Prisma + MySQL`
- Package manager: `npm`
- Main app entry: `app/`
- API base path: `/api`
- Production runtime: Next.js server (`npm start`)
- Primary storage mode: `mysql`
- Optional fallback storage mode: `json`
- Runtime file storage:
  - uploads: `public/uploads/`
  - optional JSON fallback: `data/db.json`

## 2) Codebase map
- `app/page.tsx`: home page entry
- `components/love-memory-client.tsx`: primary interactive client UI
- `app/api/data/route.ts`: read/write app data
- `app/api/upload/route.ts`: upload/delete images and thumbnails
- `app/api/health/route.ts`: runtime/deploy health check
- `app/lib/app-data.ts`: app-level data access helpers
- `app/lib/env.ts`: runtime env helpers for Next side
- `app/lib/prisma.ts`: Prisma client setup
- `prisma/schema.prisma`: Prisma schema mapped to current MySQL tables
- `public/uploads/`: original images and generated thumbnails
- `test/api.test.js`: Node built-in smoke tests for Next route handlers

## 3) Commands
- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Start: `npm start`
- Tests: `npm test`
- Prisma client generation: `npm run prisma:generate`

## 4) Deployment notes
- CI/CD workflow: `.github/workflows/deploy.yml`
- Remote deploy sync target: `/data/app/love-memory`
- Server env file: `/data/app/love-memory/.env.production`
- Container config: `docker-compose.yml`
- Docker image now builds the Next.js app and serves it with `npm start`
- Deployment performs health verification with `curl http://127.0.0.1:3000/api/health`

## 5) Working conventions
- Prefer minimal, scoped edits.
- Keep explicit, typed data transformations in the Next/TypeScript layer.
- Preserve current data contract unless the frontend and API are updated together.
- Prefer building on `app/lib/app-data.ts` instead of adding new direct SQL or ad-hoc ORM calls.
- Image variants follow this contract:
  - `url`: original image
  - `displayUrl`: detail/lightbox image
  - `thumbUrl`: gallery/grid image

## 6) Safety rules
- Do not commit real env files.
- Do not commit runtime uploads except `.gitkeep` when present.
- Do not commit runtime JSON data except `.gitkeep` when present.
- Never hardcode credentials in code.
- When changing upload behavior, keep delete behavior in sync so original and thumbnail files stay consistent.

## 7) Verification checklist
- `npm test`
- `npm run build`
- `npm start`
- `GET /api/health`
- `GET /api/data`
- `POST /api/upload` when relevant

## 8) Practical note
- The old Express/Alpine architecture has been removed from the mainline codebase.
- New work should target the Next.js architecture only.
