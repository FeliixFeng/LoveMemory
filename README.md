# LoveMemory

A long-term couples memory website built with Next.js, TypeScript, Prisma, MySQL, and local image storage.

## Stack

- Frontend and server rendering: `Next.js 15`
- Language: `TypeScript`
- Database access: `Prisma`
- Database: `MySQL`
- Image processing: `sharp`
- Styling: `Tailwind CSS` (via CDN) + local global CSS

## Features

- Anniversary countdown
- Milestones CRUD
- Hero cover upload and reset
- Photo upload with generated thumbnails
- Photo delete with file cleanup
- Gallery modal and lightbox viewer
- Quote card with random refresh
- Health check endpoint at `/api/health`

## Commands

```bash
npm install
npm run dev
npm run build
npm start
npm test
npm run prisma:generate
```

## Environment

Create `.env.local` or a production env file with:

```bash
NODE_ENV=development
PORT=3000
STORAGE_DRIVER=mysql
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=lovememory
MYSQL_USER=lovememory_app
MYSQL_PASSWORD=replace_me
DATABASE_URL=mysql://lovememory_app:replace_me@127.0.0.1:3306/lovememory
DATA_FILE=./data/db.json
UPLOAD_DIR=./public/uploads
```

Notes:

- `STORAGE_DRIVER=mysql` is the primary production mode.
- `STORAGE_DRIVER=json` remains available as a fallback for isolated local/testing scenarios.
- `UPLOAD_DIR` stores originals plus generated thumbnail files.

## Health Check

```bash
curl http://localhost:3000/api/health
```

Expected shape:

```json
{"success":true,"status":"ok","storageDriver":"mysql"}
```

## Structure

```text
app/
  api/
  lib/
components/
prisma/
public/uploads/
test/
```
