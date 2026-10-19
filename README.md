# LoveMemory

情侣纪念站：纪念日、事件时间轴、相册、消费记录、心愿与时光胶囊。

> 开发规范、数据策略、部署方式以 **[AGENTS.md](./AGENTS.md)** 为准，本文件只做概览。

## Stack

- Next.js 15（App Router）+ React 18 + TypeScript
- Prisma + **SQLite**
- 阿里云 OSS 存图，`sharp` 生成缩略图
- Tailwind CSS v4

## 本地运行

```bash
npm install
npm run dev          # http://localhost:3000
npm test
npm run build
```

## 环境变量

`.env.local`（本地，不入库）：

```bash
DATABASE_URL=file:../data/db.sqlite   # 相对 prisma/schema.prisma 解析 -> <repo>/data/db.sqlite
OSS_REGION=oss-cn-wuhan-lr
OSS_BUCKET=lovememory
OSS_ACCESS_KEY_ID=...
OSS_ACCESS_KEY_SECRET=...
OSS_ENDPOINT=https://oss-cn-wuhan-lr.aliyuncs.com
APP_PIN=******                        # 访问 PIN
```

## 数据

- 线上：服务器 `/data/app/love-memory/data/data.sqlite`，容器 bind mount，重建不丢。
- 本地：`data/db.sqlite`，内容是从线上拉的一次性快照，**之后不再同步**。
- 本地测试随便改，不影响线上；需要更新的真实数据时手动跑 `./scripts/pull-prod-db.sh`。
- 部署不传数据，只传代码。

## 部署

```bash
./scripts/deploy.sh    # rsync 代码 -> 远程 docker compose up -d --build -> 健康检查
```

线上：<https://lovexin.felixfeng.online>（nginx → 容器 `love-memory`，127.0.0.1:3001）。

## Health check

```bash
curl http://localhost:3000/api/health
# {"success":true,"status":"ok","storageDriver":"sqlite"}
```

## 目录

```text
app/(site)/     页面：首页 album capsule footprint wishes more
app/api/        API Routes
app/lib/        数据层 app-data.ts、prisma.ts、oss.ts、auth.ts
components/     UI 组件
hooks/          数据与 CRUD hooks
prisma/         schema.prisma
data/           本地 SQLite（gitignore）
scripts/        pull-prod-db.sh、deploy.sh
```
