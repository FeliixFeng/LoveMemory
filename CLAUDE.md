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
- `upload/route.ts` — POST upload image to OSS + auto-generate 480x480 thumbnail; DELETE removes from OSS
- `health/route.ts` — GET runtime health check

**Data access** goes through `app/lib/app-data.ts` — do not add direct Prisma/SQL calls elsewhere. This layer handles branching between MySQL and JSON fallback based on `STORAGE_DRIVER` env var.

**Storage modes:**
- `mysql` (primary) — Prisma ORM, schema at `prisma/schema.prisma`, singleton client at `app/lib/prisma.ts`
- `json` (fallback) — reads/writes `data/db.json`

**Image storage:** Alibaba Cloud OSS (`app/lib/oss.ts`). Photos have three URLs — `url` (original), `displayUrl` (lightbox), `thumbUrl` (gallery/grid). When changing upload behavior, keep delete in sync.

**Styling:** Tailwind CSS v4 via PostCSS build (`postcss.config.mjs`). Custom CSS variables and utility classes in `app/globals.css`.

## Conventions

- All data changes must go through `app/lib/app-data.ts`
- Preserve the data contract between frontend and API — update both together
- Keep edits minimal and scoped
- Never commit `.env.local` or credentials

## Environment

Key env vars (see `.env.example`):
- `STORAGE_DRIVER` — `mysql` or `json`
- `DATABASE_URL` or individual `MYSQL_HOST/PORT/DATABASE/USER/PASSWORD`
- `OSS_REGION`, `OSS_BUCKET`, `OSS_ACCESS_KEY_ID`, `OSS_ACCESS_KEY_SECRET`, `OSS_ENDPOINT`

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`) rsyncs to server, runs `docker-compose up -d --build`, verifies via `curl /api/health`. Server env file: `.env.production`.

## Verification

After changes: `npm test && npm run build`, then check `/api/health` and `/api/data`.
