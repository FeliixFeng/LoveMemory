# AGENTS.md
Repo-specific operating guide for autonomous coding agents in **LoveMemory**.
Use this as the default instruction source when no stricter local rules exist.

## 1) Project overview
- Stack: Node.js + Express 5 backend, static frontend (`public/index.html` + Alpine.js + Tailwind CDN)
- Package manager: npm (`package-lock.json` present)
- Module system: ESM (`"type": "module"`)
- Backend entrypoint: `src/app.js`
- API base path: `/api`
- Runtime storage driver:
  - `STORAGE_DRIVER=json` (legacy JSON file mode)
  - `STORAGE_DRIVER=mysql` (current production mode)
- Runtime persistence:
  - uploads: `public/uploads/`
  - JSON DB (legacy/fallback): `data/db.json`
  - MySQL DB (production): configured via `.env.production`
  - photo variants:
    - `url`: original uploaded file
    - `displayUrl`: main detail/lightbox image
    - `thumbUrl`: generated thumbnail for list/grid views

## 2) Codebase map (where to edit)
- `src/app.js`: app bootstrap, middleware, static serving, `/api` mount, global error middleware
- `src/routes/index.js`: route registration (`POST /upload`, `GET/POST /data`)
- `src/controllers/uploadController.js`: multer storage/filter/limits and upload response
- `src/controllers/healthController.js`: health check response for deploy/runtime smoke checks
- `src/controllers/dataController.js`: unified read/write entrypoint via storage abstraction
- `src/storage/index.js`: storage driver switch (`json` vs `mysql`)
- `src/storage/jsonStorage.js`: JSON read/write implementation (`data/db.json`)
- `src/storage/mysqlStorage.js`: MySQL schema/init + read/write implementation
- `src/config/env.js`: environment variable loading and validation
- `scripts/migrate-json-to-mysql.js`: one-time data migration tool
- `public/index.html`: UI markup, Tailwind config, Alpine bindings
- `public/js/app.js`: primary client logic (`loveMemory()` object)

## 3) Build / run / lint / test commands
### Install
- `npm install`
### Run
- Dev watch mode: `npm run dev`
- Prod-like local run: `npm start`
- JSON -> MySQL migration: `npm run migrate:mysql`
- API smoke tests: `npm test`
### Lint / test / build reality
- `npm run lint` → fails (`Missing script: lint`)
- `npm run test` → runs Node built-in API smoke tests
- `npm run build` → fails (`Missing script: build`)
- Current repo has no configured lint/build scripts; `test` now exists.
### Single-test command (important)
- There is no official single-test command yet because no test runner is configured.
- If Node built-in tests are introduced (`node:test`):
  - all tests: `node --test`
  - one file: `node --test path/to/file.test.js`
  - by name pattern: `node --test --test-name-pattern "pattern"`
- If npm `test` script is added later, prefer:
  - `npm test -- path/to/file.test.js`

## 4) Deployment / container notes
- CI/CD workflow: `.github/workflows/deploy.yml`
- Remote deploy behavior:
  - rsync repo to `/data/app/love-memory`
  - keep server-only `.env.production` (excluded from rsync delete)
  - keep `/backups/` directory (excluded from rsync delete)
  - run `docker-compose up -d --build`
- Runtime volume assumptions:
  - `./public/uploads:/app/public/uploads`
  - `./data:/app/data`
- Runtime env loading:
  - `docker-compose.yml` uses `env_file: ./.env.production`
  - `.env.production` must exist on server and should be `chmod 600`
- Local workspace tool availability:
  - `docker compose` and `docker-compose` are not installed here

## 5) Coding style conventions (observed in repo)
### JavaScript + modules
- Use ESM (`import` / `export`) only.
- Keep explicit `.js` extensions for local imports.
- Do not mix CommonJS (`require`, `module.exports`).
### Imports
- One import per line.
- Keep import blocks stable; avoid reordering unrelated imports.
- Typical pattern: package imports, Node built-ins, then local modules.
### Formatting + naming
- 2-space indentation, semicolons, single quotes.
- `camelCase` for vars/functions/methods.
- `UPPER_SNAKE_CASE` for constants (e.g., `PORT`, `DATA_FILE`, `DEFAULT_DATA`).
- Prefer `const`; use `let` only when reassignment is needed.
### Types
- Codebase is plain JavaScript (no TypeScript config).
- Do not introduce TS-only syntax unless a deliberate migration is requested.
### Async + error handling
- Use `async/await` for I/O/network work.
- Handle filesystem/network failures explicitly.
- Return JSON errors from APIs (`res.status(...).json({ error: ... })`).
- Keep logs contextual (`console.error('Save data error:', error)`).
### Express 5 patterns
- Keep routes under `/api`.
- Keep route registration in `src/routes/index.js`; business logic in controllers.
- Keep global error middleware at the end of middleware chain.
- If adding new route groups, include explicit 404 JSON handling.
### Multer / upload safety
- Keep mime-type whitelist strict.
- Keep upload size limits enforced (current: 10MB).
- Handle multer failures via JSON responses.
- Preserve upload response shape: `{ success, url, filename }`.
- Current upload flow generates a thumbnail file alongside the uploaded original image.
### Node fs + path safety
- Use `fs/promises` for async persistence.
- Keep pretty JSON writes (`JSON.stringify(data, null, 2)`).
- Resolve paths from trusted base dirs; never trust raw user file path input.
- Keep `ensureDataFile()` fallback behavior for empty/corrupt JSON.
### Env + secrets
- Never hardcode DB credentials in code.
- Use `.env.example` for template only; do not put real secrets in repo.
- `.env.production` stays on server only and must never be committed.
- `DATA_FILE` and `UPLOAD_DIR` are available for tests or isolated environments.
### Frontend patterns
- Main state container is `loveMemory()` in `public/js/app.js`.
- Keep frontend API usage aligned (`/api/data`, `/api/upload`).
- Grid/list views should prefer `thumbUrl`; lightbox/detail views should prefer `displayUrl`.
- Continue utility-first Tailwind styling in `public/index.html`.

## 6) Runtime file rules
- Do not commit user uploads:
  - `public/uploads/*` ignored except `.gitkeep`
- Do not commit runtime data:
  - `data/*.json` ignored except `.gitkeep`
- Do not commit env files:
  - `.env*` ignored except `.env.example`

## 7) Cursor / Copilot rule files
- Checked and not present:
  - `.cursor/rules/**`
  - `.cursorrules`
  - `.github/copilot-instructions.md`
- Therefore this `AGENTS.md` is the active in-repo guidance file.

## 8) Agent working agreement
- Make minimal, scoped edits; avoid broad refactors unless requested.
- Preserve API response contracts unless a coordinated change is required.
- If backend payloads change, update frontend consumers in the same change.
- If adding lint/test/build tooling, update both `package.json` scripts and this file.

## 9) Practical verification checklist
- When changing behavior, run what exists:
  1. `npm run dev` (boot smoke check)
  2. `npm start` (entrypoint smoke check)
  3. `npm test` (API smoke tests)
  4. if MySQL behavior changed: `npm run migrate:mysql` in a controlled env
  5. manual API checks when relevant:
     - `GET /api/health`
     - `GET /api/data`
     - `POST /api/data`
     - `POST /api/upload` (multipart field `image`)

## 10) Known quirks
- Keep new frontend work inside `public/js/app.js` unless a deliberate module split is requested.

## 11) External framework guardrails (docs-aligned)
- Express 5 will forward rejected async handlers to error middleware automatically.
- Keep error middleware signature as 4 args: `(err, req, res, next)`.
- Keep 404 handling explicit when adding new route groups.
- For multer errors (e.g., file size), return JSON and avoid leaking stack traces to clients.
- Never build filesystem paths directly from untrusted user input.
- Resolve and validate paths against trusted base directories before filesystem reads/writes.
- Keep upload restrictions defensive (file type + file size), not just extension checks.
- Prefer async filesystem APIs for request-time work to avoid blocking event loop.

If task requirements conflict with this file, follow explicit user instructions first and then update `AGENTS.md`.
