# AGENTS.md — LoveMemory

给 AI / 协作者的唯一事实来源。与 `CLAUDE.md` 冲突时以本文件为准。

## 这是什么

情侣纪念站（中文 UI，移动端优先）。单页 + API Routes。

- Next.js 15 App Router / React 18 / TypeScript
- Prisma + **SQLite**（MySQL 已废弃，仅迁移时用过）
- 阿里云 OSS 存图（`ali-oss` + `sharp` 生成 480x480 缩略图）
- Tailwind CSS v4（PostCSS 构建，变量在 `app/globals.css`）

## 铁律

1. **数据读写只走 `app/lib/app-data.ts`**，不要在别处直接调 Prisma。
2. **前后端契约同时改**：`lib/types.ts` ↔ `app/api/*` ↔ `hooks/*` ↔ 组件。
3. **不提交** `.env.local` / `.env.production` / `data/*.sqlite*`。
4. **线上数据是唯一真实数据**，任何开发、测试、部署操作都不得覆盖它。

## 数据策略（重点）

### 两套库，互不影响

| | 位置 | 说明 |
|---|---|---|
| 线上 | 服务器 `/data/app/love-memory/data/data.sqlite` | 容器 bind mount 到 `/app/db`，重建镜像不丢 |
| 本地 | 仓库 `data/db.sqlite` | `.env.local` 里 `DATABASE_URL=file:../data/db.sqlite` |

⚠️ **路径陷阱**：Prisma 把 `file:` 相对路径按 `prisma/schema.prisma` 所在目录解析。写 `file:./data/db.sqlite` 会落到 `prisma/data/db.sqlite`（历史上踩过，那里还留着一个 2026-07 的旧副本，可忽略）。

### 本地数据 = 一次性快照，不持续同步

- 2026-10-19 已从线上拉过一次快照（21 事件 / 15 照片 / 5 心愿 / 3 胶囊 / 3 消费）。
- **之后就用这份数据做测试，不再同步**。本地随便增删改，不会影响线上。
- 只有当确实需要一份更新的真实数据时，才手动跑：
  ```bash
  ./scripts/pull-prod-db.sh
  ```
- 这个脚本是**单向、一次性**的（线上 → 本地），不是部署流程的一部分。

### 部署不传数据

- 部署只更新代码：rsync 排除 `data/`、`public/uploads/`、`.env.production`。
- 线上库原地不动，容器重启/重建都读同一份 bind mount 文件。
- 图片不存在本地：本地和线上共用同一个 OSS bucket，**图片天然互通**。

## 开发

```bash
npm install
npm run dev      # http://localhost:3000，predev 会 rm -rf .next
npm test         # node --test，test/api.test.js
npm run build
npm run prisma:generate
```

数据层分支：`STORAGE_DRIVER`（`mysql` / `json`）只影响旧路径，当前实际走 SQLite。

## 部署

**GitHub Actions 已停用**（`.github/workflows/deploy.yml.disabled`）。2026-07-13 连续两次部署失败后手动改名关闭，之后都是手动部署。最后上线内容 = `5a47323`。

```bash
./scripts/deploy.sh    # rsync 代码 + 远程 rebuild + 健康检查
```

服务器事实：

- `ssh ali1` → `root@47.121.181.198`
- 部署目录 `/data/app/love-memory`（**不是 git 仓库**，纯文件覆盖）
- 容器 `love-memory`，端口 **3001:3000**（3000 被 `ali1-new-api` 占用）
- nginx：`lovexin.felixfeng.online` → `127.0.0.1:3001`，Let's Encrypt 证书
- 环境变量只在服务器 `.env.production`：`DATABASE_URL=file:/app/db/data.sqlite`

## UI 约定（2026-10 重构后）

### 浮层一律走 `components/ui/Overlay.tsx`

不要自己写 `fixed inset-0` + 遮罩。`Overlay` 已统一处理：锁 body 滚动、点遮罩关闭、Esc 关闭、焦点陷阱、层级。

```tsx
<Overlay onClose={...} layer="modal" panelClassName="...">
  ...
</Overlay>
```

层级常量在 `Z_LAYER`，不要硬编码 z-index：

| 层 | 值 | 用途 |
|---|---|---|
| `nav` | 40 | 顶部导航、底部 tab、悬浮按钮 |
| `sheet` | 50 | 事件详情（移动端底部抽屉） |
| `modal` | 60 | 表单 / PIN / 确认框 |
| `lightbox` | 70 | 图片灯箱 |
| `toast` | 80 | 轻提示 |

配套 hooks：

- `useScrollLock` —— 锁 body 滚动，嵌套计数（详情上再弹确认框不会提前解锁）
- `useOverlayLayer` —— Esc 只关最上面一层（详情 → 灯箱时，Esc 只关灯箱）

### 安全区

`viewport-fit=cover` 已开启，任何贴边元素都要留 `env(safe-area-inset-*)`：

- 底部 tab：`pb-[env(safe-area-inset-bottom)]`
- 页面主体：`pb-[calc(5rem_+_env(safe-area-inset-bottom))]`
- 悬浮按钮：`bottom-[calc(64px_+_env(safe-area-inset-bottom))]`
- 浮层面板：`pb-[env(safe-area-inset-bottom)]`

### 首页滚轮行为（有意为之，不要"修复"）

封面与时间轴是一体的：**页面在顶部时**，整块 hero 接管垂直滚轮 → 时间轴横向滚动。

约束（`love-memory-client.tsx`）：

- `window.scrollY > 8` 时完全不接管，避免用户想上滚回封面却被横向滚劫持
- 时间轴到头（最左/最右）时释放，把控制权还给页面，不能"卡死"
- `Ctrl / ⌘ + 滚轮`（缩放）放行
- 触控板横向手势不干预

### 表单提交

保存类操作**成功后再关表单/清草稿**，失败保留用户输入。新增列表项后要自动滚到新条目（参考 `EventDetail` 的账单表单）。

## 已知坑

1. **端口漂移**：本地 `docker-compose.yml` 写 `3000:3000`，服务器是 `3001:3000`。若恢复 CI，workflow 里健康检查写的是 `127.0.0.1:3000`，会打到 `ali1-new-api` 上造成假通过——必须改成 3001。
2. **SQLite WAL**：拷贝数据库必须连 `-wal` / `-shm` 一起，只拷主文件会丢最近的写入。
3. **`predev` 会删 `.next`**：在受限环境里可能被删除保护拦截，此时用 `npx next dev` 跳过 predev。
4. **Agent 环境启动**：若通过 WorkBuddy/CodeBuddy 的 shell 启动，`NODE_OPTIONS` 会注入 fs shim，导致 Next 建 `.next` 时报 `EEXIST`。用 `env -u NODE_OPTIONS npx next dev` 启动；用户自己终端里 `npm run dev` 不受影响。
5. **`CLAUDE.md` / `README.md` 里的 MySQL 描述已过期**，以本文件为准。
6. **配色仍是两套**：4 个文件用新暖金（NavBar / BottomTabBar / EventPreviewCard / FloatingAddButton），其余 16 个文件仍是旧赤陶。统一方案见 `PLAN.md`，改之前不要随手加新的硬编码色值。

## 目录

```
app/(site)/     首页 / album / capsule / footprint / wishes / more
app/api/        auth(PIN) data upload events expenses capsules wishes health
app/lib/        app-data.ts（数据层）prisma.ts oss.ts auth.ts schemas.ts env.ts
components/     UI（love-memory-client.tsx 是主客户端组件）
components/ui/  Overlay（统一浮层）
hooks/          useAppData / useEventCRUD / useExpenseCRUD / usePhotoUpload
                useScrollLock / useOverlayLayer
prisma/         schema.prisma（provider = sqlite）
data/           本地 SQLite（gitignore）
scripts/        pull-prod-db.sh / deploy.sh
PLAN.md         分阶段优化计划
```
