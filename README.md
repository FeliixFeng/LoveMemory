# LoveMemory

LoveMemory is a long-term couples memory website built for daily use and slow, careful iteration.

## Current abilities

- Set and edit the anniversary date
- View days together and next countdown
- Create, edit, and delete milestones
- Choose milestone icons
- Upload photos
- Generate and use real thumbnails automatically
- Delete photos and clean up files
- Update the hero cover
- Restore the default hero rotation
- Open photos in a lightbox
- Browse all photos in a dedicated gallery view
- Refresh a quote card
- Check runtime health with `/api/health`

## Stack

- `Next.js 15`
- `React 18`
- `TypeScript`
- `Prisma`
- `MySQL`
- `sharp`

## Local commands

```bash
npm install
npm run dev
npm run build
npm start
npm test
npm run prisma:generate
```

## Environment variables

Create `.env.local` or a server env file with values like:

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

- `mysql` is the main runtime mode.
- `json` remains available for isolated fallback/testing use.
- `UPLOAD_DIR` stores originals and generated thumbnails.

## Health check

```bash
curl http://localhost:3000/api/health
```

Example response:

```json
{"success":true,"status":"ok","storageDriver":"mysql"}
```

## Main folders

```text
app/
components/
prisma/
public/uploads/
test/
```
