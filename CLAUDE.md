# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

LoveMemory is a couples memory/anniversary website. UI is Chinese (zh-CN). Single-page app with server-side API routes. Next.js 15 App Router, React 18, TypeScript, Prisma + MySQL, sharp for image processing.

## Commands

| Task | Command |
|---|---|
| Install | `npm install` |
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Production | `npm start` |
| Tests | `npm test` (Node built-in runner, `test/api.test.js`) |
| Prisma client | `npm run prisma:generate` |

No linter or formatter is configured.

## Architecture

**Single-page app.** All UI lives in one client component (`components/love-memory-client.tsx`). The home page at `app/(site)/page.tsx` renders it. There is no client-side routing.

**API routes** under `app/api/`:
- `data/route.ts` — GET/POST all app data (settings, milestones, photos)
- `upload/route.ts` — POST upload image + auto-generate 480x480 thumbnail via sharp; DELETE removes both files
- `health/route.ts` — GET runtime health check

**Data access** goes through `app/lib/app-data.ts` — do not add direct Prisma/SQL calls elsewhere. This layer handles branching between MySQL and JSON fallback based on `STORAGE_DRIVER` env var.

**Storage modes:**
- `mysql` (primary) — Prisma ORM, schema at `prisma/schema.prisma`, singleton client at `app/lib/prisma.ts`
- `json` (fallback) — reads/writes `data/db.json`

**Image contract:** Photos have three URLs — `url` (original), `displayUrl` (lightbox), `thumbUrl` (gallery/grid). Thumbnails get a `_thumb` suffix. When changing upload behavior, keep delete in sync.

**Styling:** Tailwind CSS loaded via CDN `<Script>` tag in `app/layout.tsx` (no PostCSS/tailwind.config). Custom CSS variables and utility classes (`.lm-card`, `.lm-primary-btn`, etc.) in `app/globals.css`.

## Conventions

- All data changes must go through `app/lib/app-data.ts`
- Preserve the data contract between frontend and API — update both together
- Keep edits minimal and scoped
- The `src/`, `legacy-src/`, `legacy-public/` directories are empty remnants — ignore them

## Environment

Key env vars (see `.env.example`):
- `STORAGE_DRIVER` — `mysql` or `json`
- `DATABASE_URL` or individual `MYSQL_HOST/PORT/DATABASE/USER/PASSWORD`
- `UPLOAD_DIR` — defaults to `./public/uploads`

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`) rsyncs to server, runs `docker-compose up -d --build`, verifies via `curl /api/health`. Server env file: `.env.production`. Volumes mount `public/uploads` and `data/` for persistence.

## Verification

After changes: `npm test && npm run build`, then check `/api/health` and `/api/data`.
